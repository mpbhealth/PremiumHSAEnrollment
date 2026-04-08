import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormData } from '../hooks/useEnrollmentStorage';
import { maskSSN, maskCardNumber, maskRoutingNumber, maskAccountNumber } from './masking';

/** Full Tax ID/EIN on PDF (9 digits formatted as XX-XXXXXXX). */
function formatTaxIdForPdf(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'N/A';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return trimmed;
}

async function loadImageAsBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imagePath;
  });
}

export async function generateEnrollmentPDF(formData: FormData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  try {
    const logoBase64 = await loadImageAsBase64('/assets/MPB-Health-No-background.png');
    const logoWidth = 60;
    const logoHeight = 25;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
    yPosition += logoHeight + 12;
  } catch (error) {
    yPosition += 5;
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Premium HSA Member Enrollment', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Primary Member Information', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const fullAddress = `${formData.address1}, ${formData.city}, ${formData.state} ${formData.zipcode}`;

  const formatEffectiveDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const memberInfo = [
    ['Name:', `${formData.firstName} ${formData.lastName}`],
    ['Address:', fullAddress],
    ['Phone:', formData.phone],
    ['Email:', formData.email],
    ['Date of Birth:', formData.dob],
    ['Gender:', formData.gender],
    ['Smoker:', formData.smoker],
    ['SSN:', maskSSN(formData.ssn)],
    ['Effective Date:', formatEffectiveDate(formData.effectiveDate)],
    ['Benefit ID:', formData.benefitId],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: memberInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (formData.dependents && formData.dependents.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dependents Information', 14, yPosition);
    yPosition += 7;

    const dependentRows = formData.dependents.map((dep, index) => [
      `Dependent ${index + 1}`,
      `${dep.firstName} ${dep.lastName}`,
      dep.dob,
      dep.relationship,
      dep.smoker,
      dep.gender || 'N/A',
      maskSSN(dep.ssn || ''),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Name', 'DOB', 'Relationship', 'Smoker', 'Gender', 'SSN']],
      body: dependentRows,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold', padding: 1.5 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Enrollment Fees', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const enrollmentFeeAmount = formData.appliedPromo?.discountAmount
    ? 100 - formData.appliedPromo.discountAmount
    : 100;

  const enrollmentFeeText = formData.appliedPromo?.discountAmount
    ? `$${enrollmentFeeAmount.toFixed(2)} one-time discount applied`
    : '$100.00 one-time';

  const enrollmentFeesInfo = [
    ['Annual Membership Fee:', '$25.00 per Year'],
    ['Enrollment Fee:', enrollmentFeeText],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: enrollmentFeesInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Selected Products', 14, yPosition);
  yPosition += 7;

  const isSubscriberSmoker = formData.smoker.toLowerCase() === 'yes';
  const hasDependentSmoker = formData.dependents.some(dep => dep.smoker.toLowerCase() === 'yes');

  const productRows = formData.products.map((product) => {
    const smokerFee = (isSubscriberSmoker || hasDependentSmoker) ? '$50.00' : '$0.00';
    const planDisplay = product.selectedPlan || 'N/A';

    return [
      product.name,
      planDisplay,
      smokerFee,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Product', 'Plan', 'Smoker Fee']],
    body: productRows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Information', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const paymentInfo = [];
  if (formData.payment.paymentMethod === 'credit-card') {
    paymentInfo.push(
      ['Payment Method:', 'Credit Card'],
      ['Card Type:', formData.payment.ccType],
      ['Card Number:', maskCardNumber(formData.payment.ccNumber)],
      ['Expiration:', `${formData.payment.ccExpMonth}/${formData.payment.ccExpYear}`]
    );
  } else if (formData.payment.paymentMethod === 'ach') {
    paymentInfo.push(
      ['Payment Method:', 'ACH/Bank Account'],
      ['Bank Name:', formData.payment.achbank],
      ['Routing Number:', maskRoutingNumber(formData.payment.achrouting)],
      ['Account Number:', maskAccountNumber(formData.payment.achaccount)]
    );
  }

  autoTable(doc, {
    startY: yPosition,
    body: paymentInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Questionnaire Responses', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const formatAnswer = (answer: string) => {
    if (answer === 'Y') return 'YES';
    if (answer === 'N') return 'NO';
    return answer || 'N/A';
  };

  const hasSpouse = formData.dependents.some(dep => dep.relationship === 'Spouse');

  const questionnaireData = [
    ['Business Information\n\nTax ID/EIN: EIN (Employer Identification Number) or Social Security Number (for 1099 individuals). This plan is exclusively for business entities, sole proprietors, business owners, and 1099 individuals.', formatTaxIdForPdf(formData.questionnaireAnswers.businessTaxId || '')],
    ['Understanding Zion HealthShare Principles of Membership\n\nAdherence to the Zion HealthShare Principles of Membership minimizes medical risks, encourages good health practices, and ensures member integrity and accountability. Our members must comply with certain requirements to maintain membership and remain eligible to participate in our medical cost sharing community. Zion HealthShare members are expected to act with honor and integrity. Members should not falsify a sharing request, medical records, or use other deceptive practices. If a member abuses the trust of our community, their membership may be revoked or withdrawn.', formatAnswer(formData.questionnaireAnswers.zionPrinciplesAccept)],
    ['I believe that a community of ethical, health-conscious people can most effectively care for one another by directly sharing the costs associated with each other\'s healthcare needs. I acknowledge that Zion HealthShare affiliates itself with, and considers itself accountable to, a higher power. I recognize that Zion HealthShare welcomes members of all faiths.', formatAnswer(formData.questionnaireAnswers.zionm1a)],
    ['I understand that Zion HealthShare is a benevolent organization, not an insurance entity, and that Zion HealthShare cannot guarantee payment of medical expenses.', formatAnswer(formData.questionnaireAnswers.zionm1b)],
    ['I will practice good health measures and strive for a balanced lifestyle. I agree to abstain from the use of any illicit or illegal drugs and refrain from excessive alcohol consumption, acts which are harmful to the body. I understand that members who use tobacco will have an increased monthly contribution (per household membership) of $50.', formatAnswer(formData.questionnaireAnswers.zionm1d)],
    ['I am obligated to care for my family. I believe that mental, physical, emotional, or other abuse of a family member, or any other person, is morally wrong. I am committed to always treating my family and others with care and respect.', formatAnswer(formData.questionnaireAnswers.zionm1h)],
    ['I agree to submit to mediation followed by subsequent binding arbitration, if needed, for any instance of a dispute with Zion HealthShare or its affiliates. It is the members responsibility to ensure all medical bills submitted for sharing are submitted within 6 months of the date of service.', formatAnswer(formData.questionnaireAnswers.zionTimelySubmission)],
    ['Understanding of Pre-Existing Conditions: I understand that Medical Needs that result from a condition that existed prior to membership are only shareable if the condition is fully cured and 24 months have passed without symptoms, treatment, or medication, even if the cause of the symptoms is unknown or misdiagnosed.', formatAnswer(formData.questionnaireAnswers.zionmh1)],
    ['IMPORTANT! Limitations on Maternity and Delivery Needs*\n\nI understand Maternity sharing requests have a structured Initial Unshareable Amount (IUA) as follows:\n\n- Household Membership IUA: $1,000 (Standard Maternity IUA: $2,500)\n- Household Membership IUA: $2,500 (Standard Maternity IUA: $2,500)\n- Household Membership IUA: $5,000 (Standard Maternity IUA: $5,000)\n\nExpenses eligible for sharing may include prenatal care, postnatal care, and delivery. Any newborn expenses incurred after delivery are subject to a separate sharing request and IUA.\n\nMATERNITY - WAITING PERIOD\n\nMaternity sharing requests are ineligible for sharing during the first six (6) months of membership. To be eligible for sharing, the conception date must occur after six (6) months of continuous membership, as confirmed by medical records. Members who intentionally misrepresent their conception dates may be subject to membership revocation. Household memberships enrolled through a company or employer are also NOT subject to the six (6)-month waiting period.', formatAnswer(formData.questionnaireAnswers.zionmh2P)],
    ['Understanding of Limitations on Pre-Existing Conditions *\n\nI understand that Pre-existing conditions have a waiting or phase in period. Zion Health attempts to negotiate all medical bills received and many membership types include the PHCS network for pre-negotiated medical expenses.\n\n1st Year of Membership – Waiting period of all pre-existing conditions.\n2nd Year of Membership – Up to $25,000 of sharing for pre-existing conditions.\n3rd Year of Membership – Up to $50,000 of sharing for pre-existing conditions.\n4th Year of Membership and Beyond – Up to $125,000 of sharing for pre-existing conditions.', formatAnswer(formData.questionnaireAnswers.zionmh2)],
    ['Primary Member Medical Conditions *\n\nHas the primary member experienced symptoms of, been diagnosed with, or been treated for any condition within the past 24 months?\n\n*Note: A $25.00 annual fee is charged at the time of enrollment and each year thereafter. This fee covers your membership in the Mpowering Benefits Association, Inc.', formData.questionnaireAnswers.zionmh3 || 'N/A'],
    ['Primary Medical Treatments\n\nIf you have answered Yes please provide the date the treatment occurred and what type of treatment you received and/or the specific genetic defect / hereditary disease - one item per line.\n\nEXAMPLE: January 2018 abdominal hernia surgery', formData.questionnaireAnswers.primaryMedicalTreatments || 'N/A'],
    ...(hasSpouse ? [['Spouse\'s Medical Conditions *\n\nHas the primary member\'s spouse experienced symptoms of, been diagnosed with, or been treated for any condition within the past 24 months?\n\nAdd conditions below. For multiple conditions, please add one per line. (If there are no conditions present, enter NA)', formData.questionnaireAnswers.spouseMedicalConditions || 'N/A']] : []),
    ['Medical Cost Sharing Authorization: I acknowledge and understand that Medical Cost Sharing is not insurance and that I am always personally responsible for the payment of my own medical bills.', formData.questionnaireAnswers.medicalCostSharingAuth ? 'YES' : 'NO'],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: questionnaireData,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { cellWidth: 'auto', halign: 'left' }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (yPosition > pageHeight - 120) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms and Conditions for SECURE HSA', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const termsText = 'Medical Cost Sharing is not insurance or an insurance policy nor is it offered through an insurance company. Medical Cost Sharing is not a discount healthcare program nor a discount health card program. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as neither the organization nor any other member is liable for or may be compelled to make the payment of your medical bill. As such, medical cost sharing should never be considered to be insurance. Whether you receive any amounts for medical expenses and whether or not medical cost sharing continues to operate, you are always personally responsible for the payment of your own medical bills. Medical Cost Sharing is not subject to the regulatory requirements or consumer protections of your particular State\'s Insurance Code or Statutes.';
  const termsLines = doc.splitTextToSize(termsText, pageWidth - 28);
  doc.text(termsLines, 14, yPosition);
  yPosition += (termsLines.length * 5) + 10;

  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const agreementText = 'By electronically acknowledging this authorization, I acknowledge that I have read and agree to the\nterms and conditions set forth in this agreement.';
  const agreementLines = doc.splitTextToSize(agreementText, pageWidth - 28);
  doc.text(agreementLines, 14, yPosition);
  yPosition += (agreementLines.length * 5) + 5;

  if (formData.questionnaireAnswers.signatureData) {
    try {
      doc.addImage(formData.questionnaireAnswers.signatureData, 'PNG', 14, yPosition, 80, 30);
      yPosition += 35;
    } catch (error) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Signature image could not be embedded', 14, yPosition);
      yPosition += 10;
    }
  }

  if (formData.questionnaireAnswers.typedSignature) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Typed Signature: ${formData.questionnaireAnswers.typedSignature}`, 14, yPosition);
    yPosition += 7;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Signed on: ${new Date().toLocaleDateString()}`, 14, yPosition);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}
