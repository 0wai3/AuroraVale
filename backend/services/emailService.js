const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const emailFrom =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER;

function getApplicantName(name) {
    return name && name.trim()
        ? name.trim()
        : "Applicant";
}

async function sendVerificationCode(
    email,
    code,
    fullName
) {
    const applicantName =
        getApplicantName(fullName);

    await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject:
            "Welcome to AuroraVale — Verify Your Email",

        text: `
Dear ${applicantName},

Welcome to AuroraVale.

Thank you for beginning your application for our international travel and participation program.

To continue with your application, please verify your email address using the verification code below:

Your verification code: ${code}

This code is valid for 10 minutes.

Once your email has been verified, you will receive the next instructions regarding your application.

If you did not start an application with AuroraVale, you can safely ignore this email.

Regards,
AuroraVale
NGO Travel & Global Impact
        `.trim(),

        html: `
<div style="margin:0;padding:0;background:#07111f;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:18px;overflow:hidden;">

            <div style="background:#0b1b30;padding:30px;text-align:center;">
                <div style="font-size:30px;font-weight:700;color:#ffffff;">
                    AuroraVale
                </div>

                <div style="margin-top:7px;color:#7dd3fc;font-size:13px;letter-spacing:1px;">
                    NGO TRAVEL & GLOBAL IMPACT
                </div>
            </div>

            <div style="padding:36px 32px;">

                <h1 style="margin:0 0 18px;font-size:25px;color:#0b1b30;">
                    Welcome to AuroraVale
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                    Dear ${applicantName},
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">
                    Thank you for beginning your application for our international travel and participation program.
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">
                    To continue with your application, please verify your email address using the verification code below:
                </p>

                <div style="background:#eef8ff;border:1px solid #c7e7f7;border-radius:14px;padding:24px;text-align:center;margin:25px 0;">

                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:10px;">
                        Verification Code
                    </div>

                    <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#0b1b30;">
                        ${code}
                    </div>

                    <div style="font-size:13px;color:#64748b;margin-top:12px;">
                        Valid for 10 minutes
                    </div>

                </div>

                <p style="font-size:14px;line-height:1.7;color:#475569;">
                    Once your email has been verified, you will receive the next instructions regarding your application.
                </p>

                <p style="font-size:14px;line-height:1.7;color:#64748b;margin-top:24px;">
                    If you did not start an application with AuroraVale, you can safely ignore this email.
                </p>

                <div style="margin-top:32px;padding-top:22px;border-top:1px solid #e5e7eb;">

                    <strong style="color:#0b1b30;">
                        AuroraVale
                    </strong>

                    <div style="margin-top:5px;font-size:13px;color:#64748b;">
                        NGO Travel & Global Impact
                    </div>

                </div>

            </div>
        </div>
    </div>
</div>
        `.trim()
    });
}

async function sendPaymentInstructionsEmail(
    email,
    fullName,
    applicationNumber
) {
    const applicantName =
        getApplicantName(fullName);

    const amount =
        process.env.PAYMENT_AMOUNT || "20";

    const currency =
        process.env.PAYMENT_CURRENCY || "USD";

    const paymentMethod =
        process.env.PAYMENT_METHOD || "Bank Transfer";

    const bankName =
        process.env.PAYMENT_BANK_NAME || "";

    const accountTitle =
        process.env.PAYMENT_ACCOUNT_TITLE || "";

    const accountNumber =
        process.env.PAYMENT_ACCOUNT_NUMBER || "";

    const iban =
        process.env.PAYMENT_IBAN || "";

    await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject:
            "AuroraVale Application — Payment Instructions",

        text: `
Dear ${applicantName},

Your email address has been successfully verified.

The next step of your AuroraVale application is the ${currency} ${amount} application/participation fee.

Application Number:
${applicationNumber}

Payment Method:
${paymentMethod}

Payment Details:

Bank:
${bankName}

Account Title:
${accountTitle}

Account Number:
${accountNumber}

IBAN:
${iban}

Please complete the payment using the details above.

After making the payment, return to your AuroraVale application and submit your payment confirmation through the payment confirmation section.

Please keep your application number for your records and for checking your application status.

Payment of the application fee does not by itself guarantee selection, travel, visa approval, or a specific destination.

Regards,
AuroraVale
NGO Travel & Global Impact
        `.trim(),

        html: `
<div style="margin:0;padding:0;background:#07111f;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:18px;overflow:hidden;">

            <div style="background:#0b1b30;padding:30px;text-align:center;">

                <div style="font-size:30px;font-weight:700;color:#ffffff;">
                    AuroraVale
                </div>

                <div style="margin-top:7px;color:#7dd3fc;font-size:13px;letter-spacing:1px;">
                    NGO TRAVEL & GLOBAL IMPACT
                </div>

            </div>

            <div style="padding:36px 32px;">

                <h1 style="margin:0 0 18px;font-size:25px;color:#0b1b30;">
                    Email Verified Successfully
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                    Dear ${applicantName},
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">
                    Your email address has been successfully verified.
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 24px;">
                    The next step of your AuroraVale application is the
                    <strong>${currency} ${amount}</strong>
                    application/participation fee.
                </p>

                <div style="background:#f1f7fb;border:1px solid #d7e7f0;border-radius:14px;padding:22px;margin-bottom:24px;">

                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">
                        Application Number
                    </div>

                    <div style="font-size:20px;font-weight:700;color:#0b1b30;margin-top:8px;">
                        ${applicationNumber}
                    </div>

                </div>

                <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:24px;">

                    <h2 style="margin:0 0 20px;font-size:19px;color:#0b1b30;">
                        Payment Details
                    </h2>

                    <div style="margin-bottom:14px;">

                        <div style="font-size:12px;color:#64748b;">
                            Amount
                        </div>

                        <div style="font-size:17px;font-weight:700;margin-top:4px;">
                            ${currency} ${amount}
                        </div>

                    </div>

                    <div style="margin-bottom:14px;">

                        <div style="font-size:12px;color:#64748b;">
                            Payment Method
                        </div>

                        <div style="font-size:16px;font-weight:600;margin-top:4px;">
                            ${paymentMethod}
                        </div>

                    </div>

                    ${
                        bankName
                            ? `
                    <div style="margin-bottom:14px;">

                        <div style="font-size:12px;color:#64748b;">
                            Bank
                        </div>

                        <div style="font-size:16px;font-weight:600;margin-top:4px;">
                            ${bankName}
                        </div>

                    </div>
                            `
                            : ""
                    }

                    ${
                        accountTitle
                            ? `
                    <div style="margin-bottom:14px;">

                        <div style="font-size:12px;color:#64748b;">
                            Account Title
                        </div>

                        <div style="font-size:16px;font-weight:600;margin-top:4px;">
                            ${accountTitle}
                        </div>

                    </div>
                            `
                            : ""
                    }

                    ${
                        accountNumber
                            ? `
                    <div style="margin-bottom:14px;">

                        <div style="font-size:12px;color:#64748b;">
                            Account Number
                        </div>

                        <div style="font-size:16px;font-weight:600;margin-top:4px;">
                            ${accountNumber}
                        </div>

                    </div>
                            `
                            : ""
                    }

                    ${
                        iban
                            ? `
                    <div>

                        <div style="font-size:12px;color:#64748b;">
                            IBAN
                        </div>

                        <div style="font-size:16px;font-weight:600;margin-top:4px;word-break:break-word;">
                            ${iban}
                        </div>

                    </div>
                            `
                            : ""
                    }

                </div>

                <p style="font-size:14px;line-height:1.7;color:#475569;margin-top:24px;">
                    Please complete the payment using the details above.
                </p>

                <p style="font-size:14px;line-height:1.7;color:#475569;">
                    After making the payment, return to your AuroraVale application and submit your payment confirmation through the payment confirmation section.
                </p>

                <p style="font-size:14px;line-height:1.7;color:#475569;">
                    Please keep your application number for your records and for checking your application status.
                </p>

                <div style="margin-top:25px;padding:18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">

                    <strong style="color:#9a3412;">
                        Important
                    </strong>

                    <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#7c2d12;">
                        Payment of the application fee does not by itself guarantee selection, travel, visa approval, or a specific destination.
                    </p>

                </div>

                <div style="margin-top:32px;padding-top:22px;border-top:1px solid #e5e7eb;">

                    <strong style="color:#0b1b30;">
                        AuroraVale
                    </strong>

                    <div style="margin-top:5px;font-size:13px;color:#64748b;">
                        NGO Travel & Global Impact
                    </div>

                </div>

            </div>
        </div>
    </div>
</div>
        `.trim()
    });
}

async function sendPaymentVerifiedEmail(
    email,
    fullName,
    applicationNumber
) {
    const applicantName =
        getApplicantName(fullName);

    await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject:
            "AuroraVale — Payment Confirmation Received",

        text: `
Dear ${applicantName},

Your payment confirmation for AuroraVale application ${applicationNumber} has been reviewed and marked as verified.

Your application will now continue through the applicable review and selection process.

Please keep your application number for future status updates.

Application Number:
${applicationNumber}

Regards,
AuroraVale
NGO Travel & Global Impact
        `.trim()
    });
}

async function sendPaymentRejectedEmail(
    email,
    fullName,
    applicationNumber
) {
    const applicantName =
        getApplicantName(fullName);

    await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject:
            "AuroraVale — Payment Confirmation Requires Attention",

        text: `
Dear ${applicantName},

We reviewed the payment confirmation submitted for your AuroraVale application ${applicationNumber}.

At this time, the payment could not be verified.

Please review your payment information and submit a clear and valid payment confirmation through your AuroraVale application.

Your application number is:

${applicationNumber}

If you believe this was sent in error, please review the payment details and try again.

Regards,
AuroraVale
NGO Travel & Global Impact
        `.trim()
    });
}

module.exports = {
    sendVerificationCode,
    sendPaymentInstructionsEmail,
    sendPaymentVerifiedEmail,
    sendPaymentRejectedEmail
};