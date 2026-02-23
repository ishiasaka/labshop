import React, { useState } from 'react';
import {

Dialog,
DialogTitle,
DialogContent,
DialogActions,
TextField,
Button,
Box,
} from '@mui/material';

interface CreateUserDialogProps {
open: boolean;
onClose: () => void;
onCreate: (user: { student_id: string; firstname: string; lastname: string }) => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onCreate }) => {
const [studentId, setStudentId] = useState('');
const [firstname, setFirstname] = useState('');
const [lastname, setLastname] = useState('');

const handleCreate = () => {
    onCreate({ student_id: studentId, firstname, lastname });
    setStudentId('');
    setFirstname('');
    setLastname('');
    onClose();
};

const handleClose = () => {
    setStudentId('');
    setFirstname('');
    setLastname('');
    onClose();
};

return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
                <TextField
                    label="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    fullWidth
                    required
                />
                <TextField
                    label="First Name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    fullWidth
                    required
                />
                <TextField
                    label="Last Name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    fullWidth
                    required
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
                onClick={handleCreate}
                variant="contained"
                color="primary"
                disabled={!studentId || !firstname || !lastname}
            >
                Create
            </Button>
        </DialogActions>
    </Dialog>
);
};

export default CreateUserDialog;