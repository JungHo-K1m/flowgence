"use client";

import { useState } from "react";

interface ServiceType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const serviceTypes: ServiceType[] = [
  {
    id: "food-delivery",
    name: "음식 배달 앱",
    icon: "🍕",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    id: "real-estate",
    name: "부동산 플랫폼",
    icon: "🏠",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "work-management",
    name: "업무 관리 도구",
    icon: "📁",
    color: "bg-stone-100 text-stone-700 border-stone-200",
  },
  {
    id: "online-education",
    name: "온라인 교육",
    icon: "🎓",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "shopping-mall",
    name: "쇼핑몰",
    icon: "🛍️",
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
];

interface ServiceTypeButtonsProps {
  onSelect: (serviceType: string) => void;
  selectedType?: string;
}

export function ServiceTypeButtons({
  onSelect,
  selectedType,
}: ServiceTypeButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {serviceTypes.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service.id)}
          className={`
            px-2 rounded-full border-2 transition-all duration-200 hover:shadow-md h-[42px]
            ${
              selectedType === service.id
                ? `${service.color} border-current shadow-md`
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }
          `}
        >
          <div className="flex items-center space-x-2">
            <span className="text-[16px]">{service.icon}</span>
            <span className="font-medium text-[16px]">{service.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
