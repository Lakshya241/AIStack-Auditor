/**
 * Return type for email template builders.
 */
export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Builds the confirmation email sent to a lead after they submit the lead
 * capture form on their audit report page.
 *
 * @param email     - The recipient's email address (used for personalisation).
 * @param reportUrl - The full public URL of the shareable audit report.
 * @returns An object containing the email subject and HTML body.
 */
export function buildConfirmationEmail(
  email: string,
  reportUrl: string
): EmailTemplate {
  const subject = "Your AIStack Auditor Report";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Helvetica, Arial, sans-serif;
        background-color: #f9fafb;
        margin: 0;
        padding: 0;
        color: #111827;
      }
      .container {
        max-width: 560px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 40px;
        border: 1px solid #e5e7eb;
      }
      h1 {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 16px;
        color: #374151;
      }
      .cta-button {
        display: inline-block;
        background-color: #4f46e5;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 24px;
      }
      .report-url {
        font-size: 13px;
        color: #6b7280;
        word-break: break-all;
      }
      .footer {
        margin-top: 32px;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Your AIStack Auditor Report is Ready</h1>
      <p>Hi ${email},</p>
      <p>
        Thank you for using AIStack Auditor. Your personalised AI spending audit
        report has been saved and is available at the link below. You can share
        it with your team or revisit it any time.
      </p>
      <a class="cta-button" href="${reportUrl}" target="_blank" rel="noopener noreferrer">
        View Your Report
      </a>
      <p class="report-url">
        Or copy this link: <a href="${reportUrl}">${reportUrl}</a>
      </p>
      <div class="footer">
        <p>
          You received this email because you submitted your details on
          AIStack Auditor. If you did not request this, you can safely ignore
          this message.
        </p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
}
