
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CustomerWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerWarningDialog = ({ open, onOpenChange }: CustomerWarningDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client requis</DialogTitle>
          <DialogDescription>
            Ce type de vente nécessite un client associé pour le suivi des paiements.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            Veuillez sélectionner un client existant ou créer un nouveau client avant de continuer.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Compris</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerWarningDialog;
