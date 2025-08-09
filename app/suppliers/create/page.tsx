import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateSupplierForm } from "../components/create-supplier-form";
import { MotionDiv } from "@/components/motion-div";

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CreateSupplierPage() {
  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-semibold text-lg md:text-2xl">Create New Supplier</h1>
      </div>

      <div className="max-w-4xl">
        <CreateSupplierForm />
      </div>
    </MotionDiv>
  );
}