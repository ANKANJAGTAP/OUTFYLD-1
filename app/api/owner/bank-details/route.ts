import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import { createContact, createFundAccount } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/owner/bank-details
 * Save bank details and create Razorpay contact + fund account for transfers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ownerUid,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      accountType,
      panNumber,
      gstNumber,
    } = body;

    // Validate required fields
    if (!ownerUid) {
      return NextResponse.json({ error: 'Owner UID is required' }, { status: 400 });
    }

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName || !accountType || !panNumber) {
      return NextResponse.json(
        { error: 'All bank details are required (accountHolderName, accountNumber, ifscCode, bankName, accountType, panNumber)' },
        { status: 400 }
      );
    }

    // Validate IFSC format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid IFSC code format' }, { status: 400 });
    }

    // Validate PAN format
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid PAN number format' }, { status: 400 });
    }

    await connectMongoDB();

    const owner = await User.findOne({ uid: ownerUid });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    if (owner.role !== 'owner') {
      return NextResponse.json({ error: 'User is not a turf owner' }, { status: 400 });
    }

    // Create Razorpay Contact (if not already created)
    let contactId = owner.razorpayContactId;
    if (!contactId) {
      try {
        const contact = await createContact({
          name: accountHolderName,
          email: owner.email,
          contact: owner.phone || '',
          type: 'vendor',
          notes: {
            ownerUid,
            businessName: owner.businessName || '',
          },
        });
        contactId = contact.id;
      } catch (error: any) {
        console.error('Error creating Razorpay contact:', error);
        // Save bank details even if contact creation fails
        // Can retry later
      }
    }

    // Create Razorpay Fund Account (if contact was created)
    let fundAccountId = owner.razorpayLinkedAccountId;
    if (contactId && !fundAccountId) {
      try {
        const fundAccount = await createFundAccount({
          contact_id: contactId,
          account_type: 'bank_account',
          bank_account: {
            name: accountHolderName,
            ifsc: ifscCode.toUpperCase(),
            account_number: accountNumber,
          },
        });
        fundAccountId = fundAccount.id;
      } catch (error: any) {
        console.error('Error creating Razorpay fund account:', error);
        // Save bank details even if fund account creation fails
        // Can retry later
      }
    }

    // Save bank details to User
    owner.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      bankName,
      accountType,
      panNumber: panNumber.toUpperCase(),
      gstNumber: gstNumber || undefined,
    };
    owner.razorpayContactId = contactId || undefined;
    owner.razorpayLinkedAccountId = fundAccountId || undefined;
    owner.bankDetailsVerified = !!(contactId && fundAccountId);

    await owner.save();

    // Mask account number for response
    const maskedAccountNumber =
      '****' + accountNumber.slice(-4);

    return NextResponse.json({
      success: true,
      message: owner.bankDetailsVerified
        ? 'Bank details saved and Razorpay account linked successfully!'
        : 'Bank details saved. Razorpay account linking will be retried automatically.',
      bankDetails: {
        accountHolderName,
        accountNumber: maskedAccountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        accountType,
        bankDetailsVerified: owner.bankDetailsVerified,
      },
    });
  } catch (error: any) {
    console.error('Error saving bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/owner/bank-details?uid=<owner_uid>
 * Get owner's saved bank details (masked)
 */
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Owner UID is required' }, { status: 400 });
    }

    await connectMongoDB();

    const owner = await User.findOne({ uid });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    if (!owner.bankDetails) {
      return NextResponse.json({
        success: true,
        hasBankDetails: false,
        bankDetails: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasBankDetails: true,
      bankDetails: {
        accountHolderName: owner.bankDetails.accountHolderName,
        accountNumber: '****' + (owner.bankDetails.accountNumber?.slice(-4) || ''),
        ifscCode: owner.bankDetails.ifscCode,
        bankName: owner.bankDetails.bankName,
        accountType: owner.bankDetails.accountType,
        panNumber: owner.bankDetails.panNumber
          ? owner.bankDetails.panNumber.slice(0, 2) + '****' + owner.bankDetails.panNumber.slice(-2)
          : '',
        bankDetailsVerified: owner.bankDetailsVerified,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
