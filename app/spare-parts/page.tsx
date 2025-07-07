import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SparePartsTable } from "./components/spare-parts-table";
import { Suspense } from "react";
import { MotionDiv } from "@/components/motion-div";

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default async function SparePartsPage() {
  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
    >
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Spare Parts</h1>
        <Link href="/spare-parts/create" className="ml-auto">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Spare Part
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div>Loading spare parts...</div>}>
        <SparePartsTable />
      </Suspense>
    </MotionDiv>
  );
} 