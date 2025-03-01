import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JSX } from 'react';

interface modalParams {
    onOpen: boolean;
    onClose: React.Dispatch<React.SetStateAction<boolean>>;
    title?: string;
    description?: string;
    children: JSX.Element;
}

const Modal = ({onOpen, onClose, title, description, children}: modalParams) => {
  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
        </DialogContent>
    </Dialog>
  )
}

export default Modal
