import { test, expect } from '@playwright/test';

test('Should load the homepage', async ({ page }) => {
  // 1. Tell the browser to go to your home page (reads the baseURL from your config)
  await page.goto('/');

  // 2. Double-check that the page successfully loaded a body element
  const body = page.locator('body');
  await expect(body).toBeVisible();
});

test('Should load the login page', async ({ page }) => {
  await page.goto('/login');
  
  await expect(page).toHaveURL('/login');

  const loginHeading = page.getByRole('heading', { name: 'Log in' });
  await expect(loginHeading).toBeVisible();
});

test('Should log in successfully', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@marketplace.test');
  await page.getByLabel('Password').fill('buyer1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL('/');
});

test('Should load the listings page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@marketplace.test');
  await page.getByLabel('Password').fill('buyer1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/listings');
  await expect(page).toHaveURL('/listings');

  const listingsHeading = page.getByRole('heading', { name: 'Listings', level: 1 });
  await expect(listingsHeading).toBeVisible();
});

test('Should be able to add a listing', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@marketplace.test');
  await page.getByLabel('Password').fill('buyer1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  await page.goto('/listings');
  await expect(page).toHaveURL('/listings');

  const firstListing = page.locator('a[href*="/listings/"]').first();
  await expect(firstListing).toBeVisible();
  await firstListing.click();

  await expect(page).toHaveURL(/\/listings\/\d+/);

  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByText('Added to cart')).toBeVisible();
});

test('Should be able to access cart page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@marketplace.test');
  await page.getByLabel('Password').fill('buyer1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/buyer/cart');
  await expect(page).toHaveURL('/buyer/cart');

  const cartHeading = page.getByRole('heading', { name: 'Your Cart', level: 1 });
  await expect(cartHeading).toBeVisible();
});

test('Should be able to checkout cart', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@marketplace.test');
  await page.getByLabel('Password').fill('buyer1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/buyer/cart');
  await expect(page).toHaveURL('/buyer/cart');

  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL('/checkout');
});

test('Should be able to access listing creation page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('seller@marketplace.test');
  await page.getByLabel('Password').fill('seller1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/listings/new');
  await expect(page).toHaveURL('/listings/new');

  const createListingHeading = page.getByRole('heading', { name: 'Create a New Listing', level: 1 });
  await expect(createListingHeading).toBeVisible();
});

test('Should be able to add a new listing', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('seller@marketplace.test');
  await page.getByLabel('Password').fill('seller1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/listings/new');
  await expect(page).toHaveURL('/listings/new');

  await page.getByLabel('Title').fill('Test Listing');
  await page.getByLabel('Description').fill('This is a test listing.');
  await page.getByLabel('Price').fill('100');
  await page.getByRole('button', { name: 'Publish Listing →' }).click();

  await expect(page).toHaveURL(/\/listings\/[a-zA-Z0-9-]+/);
  const newListing = page.getByRole('heading', { name: 'Test Listing', level: 1 });
  await expect(newListing).toBeVisible();
});

test('Should be able to remove a listing', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@marketplace.test');
  await page.getByLabel('Password').fill('admin1234');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.goto('/listings');
  await expect(page).toHaveURL('/listings');

  const firstListing = page.locator('a[href*="/listings/"]').filter({ hasText: 'Test Listing' }).first();
  await expect(firstListing).toBeVisible();
  await firstListing.click();

  await expect(page).toHaveURL(/\/listings\/\d+/);

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Listing removed')).toBeVisible();
});