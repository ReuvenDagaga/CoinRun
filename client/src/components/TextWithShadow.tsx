import { TEXT_SHADOW } from "@/utils/textShadowStyle";
import { ReactNode } from "react";

interface TextWithShadowProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4';
}

const TextWithShadow = ({ children, className = '', as = 'p' }: TextWithShadowProps) => {
  const Component = as;
  return (
    <Component className={className} style={{ textShadow: TEXT_SHADOW }}>
      {children}
    </Component>
  );
}

export default TextWithShadow;