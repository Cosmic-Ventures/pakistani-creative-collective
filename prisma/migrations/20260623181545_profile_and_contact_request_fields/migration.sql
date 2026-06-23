-- AlterTable
ALTER TABLE "ContactRequest" DROP COLUMN "lookingFor",
DROP COLUMN "organization",
DROP COLUMN "projectDesc",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "experienceLevel" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "portfolioLink" TEXT,
ADD COLUMN     "requestType" TEXT NOT NULL,
ADD COLUMN     "requestTypeOther" TEXT,
ADD COLUMN     "requesterEmail" TEXT NOT NULL,
ADD COLUMN     "requesterName" TEXT NOT NULL,
ADD COLUMN     "requesterRole" TEXT,
ADD COLUMN     "timeline" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Creative" ADD COLUMN     "location" TEXT,
ADD COLUMN     "travel" TEXT;

