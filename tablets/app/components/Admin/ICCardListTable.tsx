"use client";

import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// ICCardStatus type
export type ICCardStatus = "active" | "inactive" | "lost" | "disabled";

// ICCard type
export interface ICCard {
  uid: string;
  student_id?: number | null;
  status: ICCardStatus;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

interface ICCardListTableProps {
  cards: ICCard[];
}

const statusLabel: Record<ICCardStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  lost: "Lost",
  disabled: "Disabled",
};

export const ICCardListTable: React.FC<ICCardListTableProps> = ({ cards }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>UID</TableCell>
          <TableCell>Student ID</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Created At</TableCell>
          <TableCell>Updated At</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cards.map((card) => (
          <TableRow key={card.uid}>
            <TableCell>{card.uid}</TableCell>
            <TableCell>{card.student_id ?? "-"}</TableCell>
            <TableCell>{statusLabel[card.status]}</TableCell>
            <TableCell>{new Date(card.created_at).toLocaleString()}</TableCell>
            <TableCell>{new Date(card.updated_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
