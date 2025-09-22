"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (requirement: Omit<any, "id">) => void;
}

export function AddRequirementModal({
  isOpen,
  onClose,
  onAdd,
}: AddRequirementModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("product");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onAdd({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("product");
      setPriority("medium");
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCategory("product");
    setPriority("medium");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 소분류 카드 추가</DialogTitle>
          <DialogDescription>
            새로운 요구사항을 추가하세요. 제목과 설명을 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              제목
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="요구사항 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              설명
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="요구사항에 대한 자세한 설명을 입력하세요"
              rows={3}
              required
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              카테고리
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">상품 관리</SelectItem>
                <SelectItem value="order">주문&결제</SelectItem>
                <SelectItem value="delivery">배송 관리</SelectItem>
                <SelectItem value="user">사용자 관리</SelectItem>
                <SelectItem value="system">시스템 관리</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              우선순위
            </label>
            <Select
              value={priority}
              onValueChange={(value: "high" | "medium" | "low") =>
                setPriority(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="우선순위를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">높음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              className="bg-[#6366F1] hover:bg-[#5B5BD6]"
              disabled={!title.trim() || !description.trim()}
            >
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
