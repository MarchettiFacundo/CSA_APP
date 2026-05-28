import { useState, useEffect } from "react";

export function InputWithHistory({
  id,
  historyKey,
  value,
  onChange,
  className,
  ...props
}) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (historyKey) {
      const stored = JSON.parse(localStorage.getItem(`history_${historyKey}`) || "[]");
      setHistory(stored);
    }
  }, [historyKey]);

  const handleBlur = (e) => {
    const val = e.target.value.trim();
    if (val && historyKey) {
      const stored = JSON.parse(localStorage.getItem(`history_${historyKey}`) || "[]");
      if (!stored.includes(val)) {
        const newHistory = [val, ...stored].slice(0, 20); // Keep max 20 items
        localStorage.setItem(`history_${historyKey}`, JSON.stringify(newHistory));
        setHistory(newHistory);
      }
    }
    if (props.onBlur) props.onBlur(e);
  };

  const listId = `${id}-list`;

  return (
    <>
      <input
        id={id}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        className={className}
        list={historyKey ? listId : undefined}
        {...props}
      />
      {historyKey && history.length > 0 && (
        <datalist id={listId}>
          {history.map((item, idx) => (
            <option key={idx} value={item} />
          ))}
        </datalist>
      )}
    </>
  );
}
