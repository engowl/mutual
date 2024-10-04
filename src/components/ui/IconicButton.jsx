import { ArrowRight } from "lucide-react";
import { cnm } from "../../utils/style";
import { Spinner } from "@nextui-org/react";

export default function IconicButton({
  children,
  className,
  arrowBoxClassName,
  isLoading = false,
  ...props
}) {
  return (
    <button
      {...props}
      className={cnm(
        "relative border border-black rounded-xl flex items-center group",
        className
      )}
      disabled={isLoading}
    >
      <div
        className={cnm(
          "absolute top-0 left-0 w-12 h-12 group-hover:w-full transition-all bg-black rounded-lg flex items-center justify-center text-white",
          arrowBoxClassName
        )}
      ></div>

      {isLoading ? (
        <div className="size-12 flex items-center justify-center text-white relative">
          <Spinner
            size="sm"
            color="white"
            className="flex items-center justify-center w-full h-72"
          />
        </div>
      ) : (
        <div className="size-12 flex items-center justify-center text-white relative">
          <ArrowRight size={24} />
        </div>
      )}

      <div className="flex items-center justify-center relative">
        {children}
      </div>
    </button>
  );
}
