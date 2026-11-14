const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Listing } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

// ---------------- Listing images ----------------
// Files are written to the caddy-served CDN directory and the public URL is
// stored on the listing. Override via env for other deployments.
// NOTE: the directory is created lazily on first upload (not at module load)
// so the API can boot on machines where the default path doesn't exist (CI,
// other dev environments).
const UPLOAD_DIR = process.env.LISTING_IMAGE_DIR || '/home/victor/canvas-solutions/listings';
const PUBLIC_BASE = process.env.LISTING_IMAGE_BASE || 'https://files.msuscb.duckdns.org/listings';
const ALLOWED_IMAGE_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/** Resolve name inside UPLOAD_DIR; null if it escapes (defense in depth). */
function safeUploadPath(name) {
  const resolved = path.resolve(UPLOAD_DIR, path.basename(name));
  return resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep) ? resolved : null;
}

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const ext = ALLOWED_IMAGE_MIME[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME[file.mimetype]) return cb(null, true);
    cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
}).single('image');

// GET /api/listings?q=&theme=&status=&min=&max=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { q, theme, status = 'Active', min, max, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (theme) filter.theme = theme;
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
    if (q) filter.$text = { $search: q };

    const perPage = Math.min(Number(limit) || 20, 100);
    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort({ creationDate: -1 })
        .skip((Number(page) - 1) * perPage)
        .limit(perPage)
        .populate('seller', 'username')
        .lean(),
      Listing.countDocuments(filter),
    ]);
    res.json({ total, page: Number(page), limit: perPage, items });
  } catch (e) {
    next(e);
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

// POST /api/listings  (Seller)
router.post('/', auth, requireRole('Seller'), async (req, res, next) => {
  try {
    const listing = await req.user.createListing(req.body);
    res.status(201).json(listing);
  } catch (e) {
    next(e);
  }
});

// POST /api/listings/:id/image  (Seller owns it, or Admin)
// multipart/form-data with a single file field named "image"
// NOTE: listing lookup + ownership checks run BEFORE multer so that no file is
// written for invalid/foreign listings, and :id is strictly validated so the
// multer filename can never traverse out of UPLOAD_DIR.
router.post('/:id/image', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    if (!OBJECT_ID_RE.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid listing id' });
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (req.user.role !== 'Admin' && String(listing.seller) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only upload images for your own listings' });
    }
    res.locals.listing = listing;
    next();
  } catch (e) {
    next(e);
  }
}, (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided (field name: "image")' });
    next();
  });
}, async (req, res, next) => {
  try {
    const listing = res.locals.listing;
    const newPath = safeUploadPath(req.file.filename);
    if (!newPath) {
      fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(req.file.filename)));
      return res.status(400).json({ error: 'Invalid upload path' });
    }

    // Replace: remove the previous image file (only our own naming pattern)
    if (listing.image) {
      try {
        const oldPath = safeUploadPath(path.basename(listing.image));
        if (oldPath && path.basename(listing.image).startsWith(`${req.params.id}-`) && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch {
        // non-fatal: stale file left behind, listing still updated below
      }
    }

    listing.image = `${PUBLIC_BASE}/${req.file.filename}`;
    await listing.save();
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/listings/:id  (Seller owns it, or Admin)
router.patch('/:id', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    let listing;
    if (req.user.role === 'Admin') {
      listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      listing = await req.user.editListing(req.params.id, req.body);
    }
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/listings/:id  (Seller owns it, or Admin) -> soft delete (status Removed)
router.delete('/:id', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    const listing =
      req.user.role === 'Admin'
        ? await Listing.findByIdAndUpdate(req.params.id, { status: 'Removed' }, { new: true })
        : await req.user.removeListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

module.exports = router;