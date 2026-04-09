import { memo } from "react";

const Spinner = memo(function Spinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#1E3A8A]"></div>
    </div>
  );
});

export default Spinner;