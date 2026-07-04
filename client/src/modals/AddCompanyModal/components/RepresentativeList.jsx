import { Representative } from './RepresentativeCard';

const initialRep = { name: '', phone: '', email: '', role: '' };

export const Representatives = ({
  formData, setFormData,
  errors,
  handleRepChange, handleRepPhoneBlur, handleRepBlur, handleTollFreePrompt,
}) => {
  const addRep = () => setFormData(prev => ({ ...prev, representatives: [...prev.representatives, { ...initialRep }] }));
  const removeRep = (index) => {
    setFormData(prev => {
      const reps = prev.representatives.filter((_, i) => i !== index);
      return { ...prev, representatives: reps };
    });
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Representatives *</label>
      {formData.representatives.map((rep, idx) => (
        <Representative
          key={idx}
          rep={rep}
          idx={idx}
          handleRepChange={handleRepChange}
          handleRepPhoneBlur={handleRepPhoneBlur}
          handleRepBlur={handleRepBlur}
          handleTollFreePrompt={handleTollFreePrompt}
          removeRep={removeRep}
          errors={errors}
        />
      ))}
      <button type="button" onClick={addRep} className="text-sm text-emerald-600 font-semibold mt-2">
        + Add Representative
      </button>
    </div>
  );
};