import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";

import { useAppSelector } from "../../redux/hooks";
import useStream, { type StreamPayload } from "@/hooks/useStream";
import type { Stream, StreamStatus } from "../../redux/slicers/stream.Slicer";

import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type StreamFormState = {
    name: string;
    status: StreamStatus;
};

const defaultFormState: StreamFormState = {
    name: "",
    status: "active",
};

const formatDate = (value?: string | null): string => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString();
};


type StreamStatusFilter = "all" | "active" | "inactive";

type StreamStatusFilterOption = {
    value: StreamStatusFilter;
    label: string;
};

const statusFilterOptions: StreamStatusFilterOption[] = [
    {
        value: "all",
        label: "All",
    },
    {
        value: "active",
        label: "Active",
    },
    {
        value: "inactive",
        label: "Inactive",
    },
];

export default function Streams() {
    const { streams } = useAppSelector((state) => state.stream);

    const { getStreams, addstream, updatestream, deletestream } = useStream();

    const [search, setSearch] = useState<string>("");
    const [addOpen, setAddOpen] = useState<boolean>(false);
    const [editItem, setEditItem] = useState<Stream | null>(null);
    const [deleteItem, setDeleteItem] = useState<Stream | null>(null);
    const [formData, setFormData] = useState<StreamFormState>(defaultFormState);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StreamStatusFilter>("all");

    useEffect(() => {
        getStreams();

    }, []);
    useEffect(() => {
        getStreams(statusFilter);
    }, [statusFilter]);
    const selectStatusTab = (item: StreamStatusFilterOption) => {
        setStatusFilter(item.value);
    };

    const filteredStreams = useMemo<Stream[]>(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return streams;

        return streams.filter((stream: any) =>
            String(stream.name).toLowerCase().includes(keyword)
        );
    }, [streams, search]);

    const openAddModal = () => {
        setFormData(defaultFormState);
        setEditItem(null);
        setAddOpen(true);
    };

    const openEditModal = (stream: Stream) => {
        setAddOpen(false);
        setEditItem(stream);

        setFormData({
            name: stream.name || "",
            status: stream.status || "active",
        });
    };

    const closeModal = () => {
        setAddOpen(false);
        setEditItem(null);
        setFormData(defaultFormState);
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            closeModal();
        }
    };

    const handleDeleteDialogOpenChange = (open: boolean) => {
        if (!open) {
            setDeleteItem(null);
        }
    };

    const handleNameChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            name: value,
        }));
    };

    const handleStatusChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            status: value as StreamStatus,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const payload: StreamPayload = {
            name: formData.name.trim(),
            status: formData.status,
        };

        if (!payload.name) return;

        try {
            setSubmitLoading(true);

            if (editItem?.id) {
                const updated = await updatestream({
                    id: editItem.id,
                    ...payload,
                });

                if (updated) {
                    closeModal();
                }

                return;
            }

            const created = await addstream(payload);

            if (created) {
                closeModal();
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem?.id) return;

        const deleted = await deletestream(deleteItem.id);

        if (deleted) {
            setDeleteItem(null);
        }
    };

    const isModalOpen = addOpen || Boolean(editItem);

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Streams" }]} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Streams</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage academic streams such as Science, Commerce, Arts, and others.
                    </p>
                </div>

                <Button type="button" onClick={openAddModal} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stream
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-border">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Stream List</CardTitle>
                            <CardDescription>
                                Showing {filteredStreams.length} of {streams.length} streams
                            </CardDescription>
                        </div>

                        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    type="search"
                                    placeholder="Search stream..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <ButtonGroup>
                                {statusFilterOptions.map((item) => (
                                    <Button
                                        key={item.value}
                                        type="button"
                                        size="sm"
                                        variant={statusFilter === item.value ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => selectStatusTab(item)}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Stream Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="w-[140px] text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredStreams.length > 0 ? (
                                filteredStreams.map((stream) => (
                                    <TableRow key={stream.id}>
                                        <TableCell className="font-medium">
                                            {stream.id}
                                        </TableCell>

                                        <TableCell>{stream.name}</TableCell>

                                        <TableCell>
                                            <Badge variant={statusToBadgeVariant(stream.status || "inactive")}>
                                                {stream.status || "inactive"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>{formatDate(stream.created_at)}</TableCell>

                                        <TableCell>{formatDate(stream.updated_at)}</TableCell>

                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="cursor-pointer"
                                                    size="icon"
                                                    onClick={() => openEditModal(stream)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>


                                                
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    className="cursor-pointer"
                                                    size="icon"
                                                    onClick={() => setDeleteItem(stream)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No streams found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? "Edit Stream" : "Add Stream"}</DialogTitle>

                        <DialogDescription>
                            {editItem
                                ? "Update the selected stream details."
                                : "Create a new academic stream."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Stream Name</Label>

                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Science"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>

                            <Select
                                value={formData.status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeModal}
                                disabled={submitLoading}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" disabled={submitLoading}>
                                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                                {submitLoading
                                    ? editItem
                                        ? "Saving..."
                                        : "Adding..."
                                    : editItem
                                        ? "Save Changes"
                                        : "Add Stream"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deleteItem)}
                onOpenChange={handleDeleteDialogOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Stream</AlertDialogTitle>

                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {deleteItem?.name}
                            </span>
                            ? This action will remove it from the active stream list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction onClick={handleDelete}>
                            Delete Stream
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}