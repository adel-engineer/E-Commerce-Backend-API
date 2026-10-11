import nodemailer from "nodemailer";
import { env } from "../config/env.js"

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user:env.SMTP_USER,
        pass: env.SMTP_PASSWORD
    }
})

export const sendEmail = async (option: {
    to: string;
    subject: string;
    html: string;
}) => {
    await transporter.sendMail({
        from: env.SMTP_USER,
        to: option.to,
        subject: option.subject,
        html: option.html
    })
}

export const sendResetPasswordEmail = async (
    email: string,
    resetToken: string
) => {
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`

    await sendEmail({
        to: email,
        subject: "Reset your password",
        html: `
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        `
    })
}

export const sendVerificationEmail = async (
    email: string,
    verificationToken: string
) => {
    
    const verificationUrl = `http://localhost:3000/api/auth/verify-email/${verificationToken}`

        await sendEmail({
        to: email,
        subject: "Verify your email",
        html: `
        <h1>Verify your password</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        `
    })
}