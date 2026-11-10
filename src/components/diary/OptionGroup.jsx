export default function OptionGroup({ id, options, value, onSelect }) {
  return (
    <div className="grid-options" id={id}>
      {options.map((option) => (
        <button key={option.value} type="button" className={`option-btn${value === option.value ? ' active' : ''}`}
          aria-pressed={value === option.value} onClick={() => onSelect(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
