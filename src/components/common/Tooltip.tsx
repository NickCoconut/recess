import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const GAP = 10;

export function Tooltip({ content, children, className, style }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.top + rect.height / 2, left: rect.right + GAP });
    }
    setVisible(true);
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={className}
        style={style}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className="pointer-events-none fixed z-200 max-w-xs"
            style={{
              top: coords.top,
              left: coords.left,
              transform: "translateY(-50%)",
              background: "rgba(15,15,20,0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "10px",
              padding: "0.6rem 0.85rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "-5px",
                width: "10px",
                height: "10px",
                background: "rgba(15,15,20,0.9)",
                borderLeft: "1px solid rgba(255,255,255,0.14)",
                borderBottom: "1px solid rgba(255,255,255,0.14)",
                transform: "translateY(-50%) rotate(45deg)",
              }}
            />
            <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-white/90">
              {content}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
