import { UploadIcon } from "@heroicons/react/solid";
import classNames from "classnames";
import { useField } from "formik";
import { CSSProperties, useEffect, useRef, useState } from "react";

type ImagePickerProps = {
  name: string;
  className?: string;
};

const ImagePicker = ({ name, className }: ImagePickerProps) => {
  const [, { error, value }, { setValue }] = useField<string>(name);
  const ref = useRef<HTMLInputElement | null>(null);
  const [url, setURL] = useState<string>();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (value) {
      setURL(value);
    } else {
      setURL(undefined);
    }
  }, [value]);

  const handleFileChange = async (file: File) => {
    const base64Data = await fileToBase64(file);
    setValue(base64Data);
  };

  const style: CSSProperties = {
    backgroundImage: url && `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <button
      className={classNames(
        className,
        "group flex h-96 w-72 items-center justify-center rounded-xl border",
        { "border-black": !error, "border-red-500": error }
      )}
      style={style}
      onClick={() => {
        if (ref.current) ref.current.click();
      }}
      type="button"
    >
      <input
        className="hidden"
        type="file"
        accept="image/png,image/jpeg"
        ref={ref}
        onChange={async (e) => {
          const file = e.target.files ? e.target.files[0] : undefined;
          if (file) {
            await handleFileChange(file);
          }
        }}
      />
      {!url && (
        <div className="flex items-center text-lg font-semibold">
          <UploadIcon className="mr-2 h-9 w-9" />
          Upload
        </div>
      )}
    </button>
  );
};

export default ImagePicker;
