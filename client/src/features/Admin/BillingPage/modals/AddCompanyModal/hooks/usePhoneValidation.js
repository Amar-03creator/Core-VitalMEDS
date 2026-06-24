import { api } from '../../../../../../services/api';

/**
 * usePhoneValidation
 *
 * WhatsApp:
 *   - Must be exactly 10 digits, starting 6–9 (validated in PhoneInput itself)
 *   - On blur, checks DB for duplicates → sets an error (not just toast) so
 *     the overlay / focus-trap can engage if needed
 *
 * Rep phone:
 *   - 11-digit entry: ask admin "Are you sure?" with Keep / Trim options
 *   - < 10 digits:    show a soft suggestion toast (no blocking)
 *   - DB duplicate:   toast.info with owner names
 */
export const usePhoneValidation = (formData, setFormData, setErrors, toast) => {

  /* ── WhatsApp ──────────────────────────────────────────────────────────── */
  const handleWhatsAppBlur = async () => {
    const num = formData.whatsapp;
    if (!num || num.length !== 10) return;          // format already handled by PhoneInput

    try {
      const check = await api.checkPhone(num);
      if (check.exists) {
        const names = check.owners.map(o => `${o.name} (${o.type})`).join(', ');
        const msg = `This number is already registered with: ${names}`;
        // Set an actual error so the focus-trap can engage
        setErrors(prev => ({ ...prev, whatsapp: msg }));
        toast.error(msg);
      } else {
        // Clear any previous duplicate error (format errors are cleared by PhoneInput)
        setErrors(prev => ({ ...prev, whatsapp: null }));
      }
    } catch {
      /* network failures are silent — don't block the user */
    }
  };

  /* ── Rep phone ─────────────────────────────────────────────────────────── */
  const handleRepPhoneBlur = async (index, value) => {
    const num = (value || '').replace(/\D/g, '');

    // Soft suggestion for < 10 digits (non-empty)
    if (num.length > 0 && num.length < 10) {
      toast.info(`Tip: Please add a 10-digit number for Rep ${index + 1} if possible.`, {
        duration: 4000,
      });
    }

    // DB duplicate check for ≥ 10 digits
    if (num.length >= 10) {
      try {
        const check = await api.checkPhone(num);
        if (check.exists) {
          const names = check.owners.map(o => `${o.name} (${o.type})`).join(', ');
          toast.info(`Rep ${index + 1}: This number is already used by — ${names}`, {
            duration: 6000,
          });
        }
      } catch {
        /* silent */
      }
    }
  };

  /* ── 11-digit toll-free prompt ─────────────────────────────────────────── */
  const handleTollFreePrompt = (index) => {
    toast.warning(
      `Rep ${index + 1}: Are you sure this is an 11-digit special/toll-free number?`,
      {
        duration: 8000,
        action: {
          label: 'Yes, keep 11 digits',
          onClick: () => {
            toast.success(`Kept 11-digit number for Rep ${index + 1}.`);
          },
        },
      }
    );

    toast.info(
      `Or trim the number to 10 digits?`,
      {
        duration: 8000,
        action: {
          label: 'Trim to 10',
          onClick: () => {
            setFormData(prev => {
              const reps = [...prev.representatives];
              reps[index] = {
                ...reps[index],
                phone: reps[index].phone.slice(0, 10),
              };
              return { ...prev, representatives: reps };
            });
            toast.success(`Rep ${index + 1} number trimmed to 10 digits.`);
          },
        },
      }
    );
  };

  return { handleWhatsAppBlur, handleRepPhoneBlur, handleTollFreePrompt };
};