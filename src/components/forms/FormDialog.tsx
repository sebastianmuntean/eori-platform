interface FormDialogProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}

export function FormDialog({ children, open, onClose }: FormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}




