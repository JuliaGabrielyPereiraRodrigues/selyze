import { useState, forwardRef, ReactNode, HTMLAttributes } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | ReactNode;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'destructive';
}

const Dialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  footer,
  size = 'md',
  variant = 'default'
}: DialogProps) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn(
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-md',
        size === 'lg' && 'max-w-lg',
        size === 'xl' && 'max-w-xl'
      )}>
        <ModalHeader>
          <ModalTitle className={cn(
            variant === 'destructive' && 'text-destructive'
          )}>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        {children}
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
};

// Dialog de Confirmação
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      variant={variant}
      footer={
        <>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading || loading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading || loading}
          >
            {isLoading || loading ? 'Processando...' : confirmText}
          </Button>
        </>
      }
    />
  );
}

// Dialog de Alerta
interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionText?: string;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'info',
  actionText = 'OK'
}: AlertDialogProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          {icons[type]}
          <span>{title}</span>
        </div>
      }
      description={description}
      size="sm"
      footer={
        <Button onClick={() => onOpenChange(false)} className="w-full">
          {actionText}
        </Button>
      }
    />
  );
}

interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, ...props }, ref) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
);
DialogTrigger.displayName = 'DialogTrigger';

export { Dialog, DialogTrigger };
