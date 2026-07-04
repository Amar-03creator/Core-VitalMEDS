import { useState } from 'react';
import { api } from '../../services/api';
import { toast } from 'sonner';

export const usePaymentActions = ({ onChanged } = {}) => {
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(null);

  const handleEdit = (receipt) => setEditingReceipt(receipt);
  const handleCancelEdit = () => setEditingReceipt(null);
  const handleSaveEdit = () => {
    setEditingReceipt(null);
    onChanged?.();
  };

  const handleDeleteConfirm = (receipt) => setDeletingReceipt(receipt);
  const handleCancelDelete = () => setDeletingReceipt(null);
  const handleDelete = async (receipt) => {
    try {
      await api.deletePaymentReceipt(receipt._id);
      toast.success('Payment deleted and ledger reversed');
      setDeletingReceipt(null);
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return {
    editingReceipt,
    deletingReceipt,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteConfirm,
    handleCancelDelete,
    handleDelete,
  };
};