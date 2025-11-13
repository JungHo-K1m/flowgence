import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "이름을 입력해주세요.").max(50, "이름은 50자 이하로 입력해주세요."),
  email: z
    .string()
    .email("올바른 이메일 형식을 입력해주세요.")
    .max(100, "이메일은 100자 이하로 입력해주세요."),
  message: z
    .string()
    .min(10, "문의 내용은 10자 이상 입력해주세요.")
    .max(2000, "문의 내용은 2,000자 이하로 입력해주세요."),
});

type SchemaType = z.infer<typeof schema>;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.CONTACT_SMTP_HOST;
  const port = process.env.CONTACT_SMTP_PORT;
  const user = process.env.CONTACT_SMTP_USER;
  const pass = process.env.CONTACT_SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP 환경 변수가 설정되어 있지 않습니다.");
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.CONTACT_SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

async function sendMail(payload: SchemaType) {
  const targetEmail = process.env.CONTACT_TARGET_EMAIL;
  if (!targetEmail) {
    throw new Error("CONTACT_TARGET_EMAIL 환경 변수가 설정되어 있지 않습니다.");
  }

  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || process.env.CONTACT_SMTP_USER || "no-reply@localhost";

  const transporterInstance = getTransporter();

  await transporterInstance.sendMail({
    from: fromEmail,
    to: targetEmail,
    replyTo: payload.email,
    subject: `[Flowgence 문의] ${payload.name}님이 보낸 메시지`,
    text: buildPlainText(payload),
    html: buildHtml(payload),
  });
}

function buildPlainText({ name, email, message }: SchemaType) {
  return `새로운 문의가 접수되었습니다.

이름: ${name}
이메일: ${email}

문의 내용:
${message}
`;
}

function buildHtml({ name, email, message }: SchemaType) {
  const escapedMessage = message.replace(/\n/g, "<br />");

  return `
    <h2>새로운 문의가 접수되었습니다.</h2>
    <p><strong>이름:</strong> ${name}</p>
    <p><strong>이메일:</strong> ${email}</p>
    <hr />
    <p>${escapedMessage}</p>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = schema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "입력값을 확인해주세요.",
          issues: result.error.format(),
        },
        { status: 400 },
      );
    }

    await sendMail(result.data);

    return NextResponse.json(
      {
        message: "문의가 정상적으로 접수되었습니다.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("문의 메일 발송 실패:", error);

    return NextResponse.json(
      {
        message: "문의 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }
}

