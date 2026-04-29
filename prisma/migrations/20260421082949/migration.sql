/*
  Warnings:

  - You are about to alter the column `entity_code` on the `registrations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `registrations` MODIFY `entity_code` VARCHAR(191) NULL;
