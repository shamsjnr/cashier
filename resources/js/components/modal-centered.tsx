import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/dialog-centered';
import { JSX } from 'react';

interface modalParams {
    onOpen: boolean;
    onClose: React.Dispatch<React.SetStateAction<boolean>>;
    title?: string;
    description?: string;
    children: JSX.Element;
}

const ModalCentered = ({onOpen, onClose, title, description, children}: modalParams) => {
  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {children}
        </DialogContent>
    </Dialog>
  )
}

export default ModalCentered
