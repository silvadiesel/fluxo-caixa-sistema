"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, AlertTriangle } from "lucide-react"

interface ModalDeleteProps {
    itemName: string
    itemType: string
    onConfirm?: () => void
    trigger?: React.ReactNode
}

export function ModalDelete({ itemType, onConfirm, trigger }: ModalDeleteProps) {
    const [open, setOpen] = useState(false)

    const handleConfirm = () => {
        onConfirm?.()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-left">Confirmar Exclusão</DialogTitle>
                            <DialogDescription className="text-left">Esta ação não pode ser desfeita.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Tem certeza que deseja excluir {itemType.toLowerCase()}{" "}
                        <span className="font-medium text-foreground"></span>?
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
