import { useState, useRef, useCallback } from 'react';
import { api } from '../../../services/api';

/**
 * useDrugLicenses
 *
 * KEY ADDITION:
 * `handleLicenseInputBlur` — fired when the drug-license text field loses focus.
 * If the admin has typed something but hasn't clicked Add, we:
 *   1. Show a toast warning them to click Add first.
 *   2. Re-focus the input after a short tick (so focus can't escape).
 *
 * The trap is released only when:
 *   - The input is empty (admin cleared it themselves), OR
 *   - The admin successfully clicks Add / Update.
 */
export const useDrugLicenses = (formData, setFormData, errors, setErrors, toast) => {
  const [licenseInput, setLicenseInput]           = useState('');
  const [editingLicenseIndex, setEditingLicenseIndex] = useState(null);

  // Ref to the <input> DOM node so we can re-focus it
  const licenseInputRef = useRef(null);

  // Whether the blur-trap is active for this field
  const trapPending = useRef(false);

  /* ── Blur handler ──────────────────────────────────────────────────────── */
  const handleLicenseInputBlur = useCallback((e) => {
    const value = licenseInput.trim();
    if (!value) return;   // empty → let focus move freely

    // Don't trap if the user clicked the Add/Update or Cancel button
    // (those fire their own click handlers before blur settles)
    const relatedTarget = e.relatedTarget;
    if (relatedTarget) {
      const tag  = relatedTarget.tagName;
      const text = (relatedTarget.textContent || '').trim();
      // Allow clicks on Add / Update / Cancel buttons
      if (
        tag === 'BUTTON' &&
        (text.includes('Add') || text.includes('Update') || text.includes('Cancel'))
      ) {
        return;
      }
    }

    // Admin typed something and tried to leave → warn + re-focus
    trapPending.current = true;
    toast.warning(
      `Please click "Add" to save the drug licence "${value}" before moving on.`,
      { duration: 4000 }
    );

    // Re-focus after the current event cycle finishes
    setTimeout(() => {
      if (trapPending.current && licenseInputRef.current) {
        licenseInputRef.current.focus();
      }
    }, 0);
  }, [licenseInput, toast]);

  /* ── Add / Update ──────────────────────────────────────────────────────── */
  const handleAddOrUpdateLicense = async () => {
    const value = licenseInput.trim();
    if (!value) return;

    // Check duplicate within form
    const duplicateIndex = formData.drugLicenses.findIndex(
      (l, i) => l.trim() === value && i !== editingLicenseIndex
    );
    if (duplicateIndex !== -1) {
      const err = 'This licence is already added.';
      setErrors(prev => ({ ...prev, drugLicenseInput: err }));
      toast.error(err);
      return;
    }

    // Check database
    try {
      const check = await api.checkDrugLicense(value);
      if (check.exists) {
        const owner = check.owner;
        const err = `Already registered with ${owner.type} "${owner.name}"${owner.city ? ` (${owner.city})` : ''}.`;
        setErrors(prev => ({ ...prev, drugLicenseInput: err }));
        toast.error(err);
        return;
      }
    } catch {
      toast.error('Unable to verify drug licence. Please try again.');
      return;
    }

    // All clear — release trap and add/update
    trapPending.current = false;

    setFormData(prev => {
      const licences = [...prev.drugLicenses];
      if (editingLicenseIndex !== null) {
        licences[editingLicenseIndex] = value;
      } else {
        const emptyIndex = licences.findIndex(l => l.trim() === '');
        if (emptyIndex !== -1) licences[emptyIndex] = value;
        else licences.push(value);
      }
      return { ...prev, drugLicenses: licences };
    });

    setLicenseInput('');
    setEditingLicenseIndex(null);
    setErrors(prev => ({ ...prev, drugLicenseInput: null }));
  };

  /* ── Edit ──────────────────────────────────────────────────────────────── */
  const handleEditLicense = (index) => {
    trapPending.current = false;
    const lic = formData.drugLicenses[index];
    setLicenseInput(lic);
    setEditingLicenseIndex(index);
    setErrors(prev => ({ ...prev, drugLicenseInput: null }));
  };

  /* ── Cancel ────────────────────────────────────────────────────────────── */
  const cancelEditLicense = () => {
    trapPending.current = false;
    setLicenseInput('');
    setEditingLicenseIndex(null);
    setErrors(prev => ({ ...prev, drugLicenseInput: null }));
  };

  /* ── Remove ────────────────────────────────────────────────────────────── */
  const removeDrugLicense = (index) => {
    setFormData(prev => {
      const licences = prev.drugLicenses.filter((_, i) => i !== index);
      if (licences.length === 0) licences.push('');
      return { ...prev, drugLicenses: licences };
    });
    if (editingLicenseIndex === index) {
      trapPending.current = false;
      setLicenseInput('');
      setEditingLicenseIndex(null);
    }
  };

  return {
    licenseInput, setLicenseInput,
    licenseInputRef,
    editingLicenseIndex,
    handleLicenseInputBlur,
    handleAddOrUpdateLicense,
    handleEditLicense,
    cancelEditLicense,
    removeDrugLicense,
  };
};