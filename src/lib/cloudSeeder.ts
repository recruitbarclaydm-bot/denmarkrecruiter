import { INITIAL_CANDIDATES } from '@/data/mockUsers';
import { createEphemeralSupabaseClient } from '@/lib/supabase';

const seedEmails = ['dk3430143@gmail.com', 'madanadhikari65@gmail.com'];

export const seedDipakAndNokha = async (passwords: Record<string, string>) => {
  const client = createEphemeralSupabaseClient();

  for (const email of seedEmails) {
    const template = INITIAL_CANDIDATES.find((candidate) => candidate.email === email);
    const password = passwords[email];
    if (!template || !password) throw new Error(`Missing seed profile or password for ${email}.`);

    let { data: authData, error: authError } = await client.auth.signUp({ email, password });
    if (authError || !authData.session || !authData.user) {
      await client.auth.signOut();
      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error || !signIn.data.user) {
        throw new Error(`Unable to create or sign in to ${email}: ${signIn.error?.message || authError?.message || 'No session returned.'}`);
      }
      authData = signIn.data;
    }

    const candidateId = authData.user?.id;
    if (!candidateId) throw new Error(`Supabase did not return a user ID for ${email}.`);
    const { error: profileError } = await client.from('candidates').upsert({
      id: candidateId,
      email: template.email,
      full_name: template.name,
      role: 'candidate',
      account_status: template.accountStatus,
      kyc_status: template.kycStatus,
      kyc_note: template.kycNote || '',
      current_stage: template.currentStage,
      passport_number: template.passportNumber,
      passport_expiry: template.passportExpiry || null,
      dob: template.dob,
      nationality: template.nationality,
      address: template.permanentAddress,
      phone: template.phone,
      scheme: template.schemeType,
      sponsor_code: template.employer.sponsorCode,
      case_order_id: template.siriCaseOrder.caseOrderId,
      employer_name: template.employer.name,
      denbar_balance: template.denbarAccount?.amount.replace(/[^0-9.]/g, '') || null,
      subscription_status: template.actionRequired?.subscription || template.denbarAccount?.status || null,
    }, { onConflict: 'id' });
    if (profileError) throw profileError;

    const { data: existingDocuments, error: documentsError } = await client
      .from('dossier_documents')
      .select('name')
      .eq('candidate_id', candidateId);
    if (documentsError) throw documentsError;
    const existingNames = new Set((existingDocuments || []).map((document) => document.name));
    const missingDocuments = template.documents.filter((document) => !existingNames.has(document.title));
    if (missingDocuments.length) {
      const { error } = await client.from('dossier_documents').insert(missingDocuments.map((document) => ({
        candidate_id: candidateId,
        name: document.title,
        category: document.category || 'General',
        direction: document.isDispatchedByAdmin ? 'admin_dispatched' : 'candidate_upload',
        requires_signature: Boolean(document.requiresSignature),
        status: document.status === 'verified'
          ? 'verified'
          : document.status === 'rejected' || document.status === 'flagged'
          ? 'rejected'
          : document.status === 'signed_pending_review'
          ? 'signed_pending_review'
          : document.status === 'action_required' && document.requiresSignature
          ? 'awaiting_signature'
          : 'pending',
        rejection_reason: document.rejectionReason || null,
        storage_path: null,
        signature_data: document.signatureDataUrl || null,
        uploaded_at: document.uploadedAt || new Date().toISOString(),
      })));
      if (error) throw error;
    }

    const { data: existingLogs, error: logsError } = await client
      .from('audit_logs')
      .select('action')
      .eq('candidate_id', candidateId);
    if (logsError) throw logsError;
    const existingActions = new Set((existingLogs || []).map((log) => log.action));
    const missingLogs = template.auditLog.filter((log) => !existingActions.has(log.action));
    if (!existingActions.has('Checklist State')) {
      missingLogs.push({
        id: `seed_checklist_${candidateId}`,
        timestamp: new Date().toISOString(),
        actor: 'Cloud Seeder',
        action: 'Checklist State',
        details: JSON.stringify(template.checklist),
      });
    }
    if (missingLogs.length) {
      const { error } = await client.from('audit_logs').insert(missingLogs.map((log) => ({
        candidate_id: candidateId,
        actor: log.actor,
        action: log.action,
        details: log.details,
      })));
      if (error) throw error;
    }

    const { data: existingNotifications, error: notificationsError } = await client
      .from('notifications')
      .select('title')
      .eq('candidate_id', candidateId);
    if (notificationsError) throw notificationsError;
    const existingTitles = new Set((existingNotifications || []).map((item) => item.title));
    const missingNotifications = template.notifications.filter((item) => !existingTitles.has(item.title));
    if (missingNotifications.length) {
      const { error } = await client.from('notifications').insert(missingNotifications.map((item) => ({
        candidate_id: candidateId,
        title: item.title,
        message: item.message,
        is_read: item.read,
      })));
      if (error) throw error;
    }

    await client.auth.signOut();
  }
};