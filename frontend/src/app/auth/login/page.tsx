"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectStep = searchParams.get("step");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // 로그인 성공 시 리다이렉트 처리
        if (redirectStep) {
          // 특정 단계로 리다이렉트 (쿼리 파라미터 포함)
          router.push(`/?step=${redirectStep}`);
        } else {
          // 기본 홈페이지로 리다이렉트
          router.push("/");
        }
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo - Symbol Only */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
          <p className="mt-1 text-sm text-gray-600">
            Flowgence에 오신 것을 환영합니다
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>계정에 로그인</CardTitle>
            <CardDescription>이메일과 비밀번호를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6366F1] hover:bg-[#5B5BD6]"
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-[#6366F1] hover:text-[#5B5BD6]"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div
              className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
              style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
            />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
