"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Shelf } from "@/lib/types";
import { Plus, HardDrive, Usb, Tag } from "lucide-react";

export default function ShelvesPage() {
  const { data, isLoading, mutate } = useSWR("shelves", () => api.getShelves());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const shelves = data?.shelves || [];

  return (
    <>
      <Header
        title="Shelves"
        description="Manage product storage locations"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Shelf
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Shelves</p>
              <p className="text-2xl font-semibold">{shelves.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Average Price</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(
                  shelves.length > 0
                    ? shelves.reduce((sum, s) => sum + s.price, 0) / shelves.length
                    : 0
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">USB Ports Used</p>
              <p className="text-2xl font-semibold">
                {new Set(shelves.map((s) => s.usb_port)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shelves Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading shelves...</p>
            </div>
          </div>
        ) : shelves.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <HardDrive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No shelves configured yet</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4" />
                Add First Shelf
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shelves.map((shelf) => (
              <ShelfCard key={shelf.id} shelf={shelf} />
            ))}
          </div>
        )}
      </div>

      {/* Create Shelf Modal */}
      <CreateShelfModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          mutate();
        }}
      />
    </>
  );
}

// Shelf Card Component
function ShelfCard({ shelf }: { shelf: Shelf }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <Badge variant="outline" className="font-mono">
            {shelf.shelf_id}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Usb className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">USB Port:</span>
            <span className="font-medium">{shelf.usb_port}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Price:</span>
            <span className="font-medium text-success">
              {formatCurrency(shelf.price)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created {formatDate(shelf.created_at)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Shelf Modal Component
function CreateShelfModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    shelf_id: "",
    usb_port: "",
    price: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.createShelf({
        shelf_id: formData.shelf_id,
        usb_port: parseInt(formData.usb_port),
        price: parseInt(formData.price),
      });
      setFormData({ shelf_id: "", usb_port: "", price: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shelf");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Shelf"
      description="Configure a new product storage location"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <Input
          label="Shelf ID"
          id="shelf_id"
          placeholder="e.g., SHELF-A1"
          value={formData.shelf_id}
          onChange={(e) => setFormData({ ...formData, shelf_id: e.target.value })}
          required
        />

        <Input
          label="USB Port"
          id="usb_port"
          type="number"
          placeholder="1-7"
          min={1}
          max={7}
          value={formData.usb_port}
          onChange={(e) => setFormData({ ...formData, usb_port: e.target.value })}
          required
        />

        <Input
          label="Price (THB)"
          id="price"
          type="number"
          placeholder="Enter price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Create Shelf
          </Button>
        </div>
      </form>
    </Modal>
  );
}
