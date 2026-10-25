/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "isActive" SET DEFAULT true,
ALTER COLUMN "avgRating" SET DEFAULT 0,
ALTER COLUMN "salesCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "isActive" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
