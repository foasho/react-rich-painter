import React, { useState, useRef, useEffect } from "react";
import { usePainter } from "../../PainterContext";
import { useBrushBarStore } from "../../store/brush";

type CustomBrushSelectorProps = {
  size?: number;
};

const CustomBrushSelector: React.FC<CustomBrushSelectorProps> = ({
  size = 30,
}) => {
  const { painter } = usePainter();
  const { customBrushIndex, customBrushImages, setCustomBrushIndex } =
    useBrushBarStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // クリック外しで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  const handleBrushSelect = (index: number | null) => {
    if (!painter) return;

    const brush = painter.getBrush();
    if (!brush) return;

    if (index === null) {
      // "なし" を選択した場合、カスタムブラシをクリア
      brush.setImage(null);
      setCustomBrushIndex(null);
    } else if (customBrushImages[index]) {
      // カスタムブラシを選択
      brush.setImage(customBrushImages[index]);
      setCustomBrushIndex(index);
    }

    // 選択後に閉じる
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const activeItemStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: "2px solid #007bff",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transition: "all 0.2s ease",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: `${size + 8}px`,
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#fff",
    border: "2px solid #ccc",
    borderRadius: "4px",
    padding: "8px",
    display: isOpen ? "flex" : "none",
    flexDirection: "row",
    gap: "8px",
    flexWrap: "wrap",
    zIndex: 1000,
    maxWidth: "200px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const brushItemStyle = (isSelected: boolean): React.CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    border: isSelected ? "2px solid #007bff" : "2px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: isSelected ? "#e0f0ff" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transition: "all 0.2s ease",
  });

  const brushImageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const noneItemStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#666",
  };

  // 現在選択中のブラシを取得
  const getActiveContent = () => {
    if (customBrushIndex === null) {
      return <span style={noneItemStyle}>✕</span>;
    } else if (customBrushImages[customBrushIndex]) {
      return (
        <img
          src={customBrushImages[customBrushIndex].src}
          alt={`Brush ${customBrushIndex}`}
          style={brushImageStyle}
          draggable={false}
        />
      );
    }
    return <span style={noneItemStyle}>✕</span>;
  };

  return (
    <div style={containerStyle} ref={containerRef}>
      {/* アクティブなブラシ表示 */}
      <div
        style={activeItemStyle}
        onClick={toggleOpen}
        role="button"
        aria-label="ブラシを選択"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggleOpen();
          }
        }}
      >
        {getActiveContent()}
      </div>

      {/* ドロップダウンリスト */}
      <div style={dropdownStyle}>
        {/* "なし" オプション */}
        <div
          style={brushItemStyle(customBrushIndex === null)}
          onClick={() => handleBrushSelect(null)}
          role="button"
          aria-label="カスタムブラシなし"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleBrushSelect(null);
            }
          }}
        >
          <span style={noneItemStyle}>✕</span>
        </div>

        {/* カスタムブラシ画像 */}
        {customBrushImages.map((img, index) => (
          <div
            key={index}
            style={brushItemStyle(customBrushIndex === index)}
            onClick={() => handleBrushSelect(index)}
            role="button"
            aria-label={`カスタムブラシ ${index + 1}`}
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleBrushSelect(index);
              }
            }}
          >
            <img
              src={img.src}
              alt={`Brush ${index}`}
              style={brushImageStyle}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export { CustomBrushSelector };
