"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요.").max(50, "이름은 50자 이하로 입력해주세요."),
  email: z.string().email("올바른 이메일 형식을 입력해주세요.").max(100, "이메일은 100자 이하로 입력해주세요."),
  message: z
    .string()
    .min(10, "문의 내용은 10자 이상 입력해주세요.")
    .max(2000, "문의 내용은 2,000자 이하로 입력해주세요."),
});

type FormSchema = z.infer<typeof formSchema>;

export default function ContactPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormSchema) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(result?.message ?? "문의 처리 중 오류가 발생했습니다.");
        return;
      }

      setSuccessMessage(result?.message ?? "문의가 정상적으로 접수되었습니다.");
      reset();
    } catch (error) {
      console.error("문의 전송 실패:", error);
      setServerError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">문의하기</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                연락처 정보
              </h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium">이메일:</span>{" "}
                  contact@flowgence.ai
                </p>
                {/* <p className="text-gray-600">
                  <span className="font-medium">전화:</span> 02-1234-5678
                </p> */}
                <p className="text-gray-600">
                  <span className="font-medium">주소:</span> 대전광역시 중구 중앙로 101<br/>
                  대전창업허브 406호
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                빠른 문의
              </h2>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register("name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력해주세요"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register("email")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이메일을 입력해주세요"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    문의내용
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    {...register("message")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="문의내용을 입력해주세요"
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.message.message}
                    </p>
                  )}
                </div>
                {serverError && (
                  <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "전송 중..." : "문의하기"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
