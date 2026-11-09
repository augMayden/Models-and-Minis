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

test('Should be able to open a listing', async ({ page }) => {
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
});