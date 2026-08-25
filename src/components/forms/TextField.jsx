export default function TextField({ label, name, onChange, required = false, type = 'text', value }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="tlali-input"
        name={name}
        onChange={onChange}
        required={required}
        step={type === 'number' ? '0.1' : undefined}
        type={type}
        value={value}
      />
    </label>
  )
}
