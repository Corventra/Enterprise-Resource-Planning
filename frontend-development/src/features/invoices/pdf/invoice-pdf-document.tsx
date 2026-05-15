import type { CSSProperties } from 'react';
import dskLogoUrl from '../../../assets/branding/dsk_logo.svg';
import { INVOICE_PDF_DSK_BRANDING } from './invoice-pdf-dsk-branding';
import { formatPdfCurrencyIdr, formatPdfPercentLabel } from './invoice-pdf-formatters';
import type { InvoicePdfViewModel } from './invoice-pdf-types';

const box: CSSProperties = { boxSizing: 'border-box' };

export interface InvoicePdfDocumentProps {
  data: InvoicePdfViewModel;
}

export const InvoicePdfDocument = ({ data }: InvoicePdfDocumentProps) => {
  const b = INVOICE_PDF_DSK_BRANDING;
  const desc = data.descriptionLine;

  return (
    <div
      data-invoice-pdf-root
      style={{
        ...box,
        width: '794px',
        minHeight: '1123px',
        padding: '36px 40px 48px',
        backgroundColor: '#ffffff',
        color: '#191c1e',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: 1.45,
      }}
    >
      {/* Issuer left; INVOICE + meta table right (same row) */}
      <div style={{ ...box, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '28px' }}>
        <div style={{ flex: '1 1 55%', minWidth: 0, maxWidth: '420px' }}>
          <img
            src={dskLogoUrl}
            alt={b.companyName}
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              display: 'block',
              marginBottom: '10px',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{b.companyName}</div>
          {b.addressLines.map((line) => (
            <div key={line} style={{ color: '#4b5563', fontSize: '10px' }}>
              {line}
            </div>
          ))}
          <div style={{ marginTop: '10px', fontSize: '11px' }}>
            {b.companyName}
          </div>
          <div style={{ marginTop: '2px', fontSize: '10px' }}>
            <span style={{ fontWeight: 700 }}>{b.npwpLabel}: </span>
            <span>{b.npwpValue}</span>
          </div>
        </div>
        <div
          style={{
            flex: '0 1 45%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.06em', color: '#003c90' }}>INVOICE</div>
          <table style={{ borderCollapse: 'collapse', fontSize: '10px', marginTop: '15px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', fontWeight: 700, color: '#6b7280', verticalAlign: 'top' }}>DATE</td>
                <td style={{ padding: '2px 0', fontWeight: 600 }}>{data.issueDateLabel}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', fontWeight: 700, color: '#6b7280', verticalAlign: 'top' }}>INVOICE #</td>
                <td style={{ padding: '2px 0', fontWeight: 700 }}>{data.invoiceNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', fontWeight: 700, color: '#6b7280', verticalAlign: 'top' }}>BILL TO</td>
                <td style={{ padding: '2px 0', fontWeight: 700, fontSize: '12px', verticalAlign: 'top' }}>{data.clientCompanyName}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', verticalAlign: 'top' }} />
                <td style={{ padding: '2px 0', color: '#4b5563', whiteSpace: 'pre-line', verticalAlign: 'top' }}>{data.clientCompanyAddress}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main table */}
      <div style={{ ...box, marginTop: '26px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f4f6' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                DESCRIPTION
              </th>
              <th
                style={{
                  textAlign: 'right',
                  width: '160px',
                  padding: '10px 12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                  borderLeft: '1px solid #e5e7eb',
                }}
              >
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: '14px 12px 150px 12px',
                  verticalAlign: 'top',
                  borderBottom: '1px solid #eceef0',
                }}
              >
                {desc}
              </td>
              <td
                style={{
                  padding: '14px 12px 150px 12px',
                  verticalAlign: 'top',
                  borderBottom: '1px solid #eceef0',
                  textAlign: 'right',
                  fontWeight: 700,
                  borderLeft: '1px solid #e5e7eb',
                }}
              >
                {formatPdfCurrencyIdr(data.lineGrossAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment left, summary right */}
      <div style={{ ...box, marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
        <div style={{ flex: '1 1 50%', maxWidth: '360px' }}>
          <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em', color: '#6b7280', marginBottom: '6px' }}>Payment :</div>
          <div style={{ fontWeight: 600 }}>{b.bankAccountHolder}</div>
          <div style={{ marginTop: '4px' }}>
            <span style={{ fontWeight: 700 }}>{b.bankAccountNumber}</span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span>{b.bankName}</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: '#6b7280', fontStyle: 'italic' }}>{b.paymentNote}</div>
        </div>

        <div style={{ flex: '0 0 260px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              <SummaryRow label="SUBTOTAL (DPP)" value={formatPdfCurrencyIdr(data.dppAmount)} />
              <SummaryRow
                label={`TAX (${formatPdfPercentLabel(data.ppnRatePercent)})`}
                value={formatPdfCurrencyIdr(data.ppnAmount)}
              />
              <SummaryRow
                label={`WITHHOLDING TAX (${formatPdfPercentLabel(data.pph23RatePercent)})`}
                value={`(${formatPdfCurrencyIdr(data.pph23Amount)})`}
              />
              <SummaryRow label="OTHER" value={formatPdfCurrencyIdr(0)} />
              <tr>
                <td
                  colSpan={2}
                  style={{
                    borderTop: '2px solid #003c90',
                    paddingTop: '8px',
                    paddingBottom: '4px',
                  }}
                />
              </tr>
              <tr>
                <td style={{ fontWeight: 800, fontSize: '11px', padding: '4px 0' }}>TOTAL</td>
                <td style={{ fontWeight: 800, fontSize: '12px', textAlign: 'right', padding: '4px 0', color: '#003c90' }}>
                  {formatPdfCurrencyIdr(data.netAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature */}
      <div style={{ ...box, marginTop: '70px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '240px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '11px' }}>DSK Global</div>
          <div
            style={{
              height: '85px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '9px',
              marginBottom: '8px',
            }}
          >
          </div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>{b.directorName}</div>
          <div style={{ marginTop: '2px', fontSize: '10px', color: '#6b7280' }}>{b.directorTitle}</div>
        </div>
      </div>
    </div>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '4px 0', color: '#4b5563', fontWeight: 600 }}>{label}</td>
      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{value}</td>
    </tr>
  );
}
