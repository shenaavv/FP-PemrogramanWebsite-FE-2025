import React from "react";

interface DraggableOptionProps {
  value: string;
  isSelected: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const PRIMARY_ORANGE = "#E2852E";
const SOFT_YELLOW = "#F5C857";

const DraggableOption: React.FC<DraggableOptionProps> = ({
  value,
  isSelected,
  onDragStart,
  onDragEnd,
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`rounded-full px-6 py-2 text-lg font-bold shadow-md border-2 border-transparent transition-colors duration-150 bg-white text-[${PRIMARY_ORANGE}] hover:bg-[${SOFT_YELLOW}] cursor-grab ${isSelected ? "opacity-50" : ""}`}
    style={{ userSelect: "none" }}
    aria-label={`Drag ${value}`}
  >
    {value.toUpperCase()}
  </div>
);

export default DraggableOption;
