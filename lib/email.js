import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate a random temporary password
export const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Send temporary password email to lecturer
export const sendTemporaryPasswordEmail = async (lecturerData, temporaryPassword) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: lecturerData.email,
      subject: 'Welcome to GradeSync - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GradeSync</h1>
              <p style="color: #64748b; margin: 5px 0 0 0;">Academic Management System</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome to GradeSync!</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Dear ${lecturerData.title ? lecturerData.title + ' ' : ''}${lecturerData.firstName} ${lecturerData.lastName},
            </p>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Your lecturer account has been successfully created in the GradeSync system. Below are your login credentials:
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0;">Account Details:</h3>
              <p style="margin: 8px 0; color: #475569;"><strong>Staff ID:</strong> ${lecturerData.staffId}</p>
              <p style="margin: 8px 0; color: #475569;"><strong>Email:</strong> ${lecturerData.email}</p>
              <p style="margin: 8px 0; color: #475569;"><strong>Temporary Password:</strong> <span style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">${temporaryPassword}</span></p>
              <p style="margin: 8px 0; color: #475569;"><strong>Department:</strong> ${lecturerData.departmentName}</p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              You can now log in to the GradeSync system using your email and the temporary password provided above.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lecturer/login" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Login to GradeSync
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
              If you have any questions or need assistance, please contact the system administrator.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Best regards,<br>
              GradeSync Administration Team
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Generate auto staff ID
export const generateStaffId = async (departmentCode) => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Create staff ID format: DEPT-YY-XXXX (e.g., CSC-24-0001)
    const prefix = `${departmentCode}-${currentYear}-`;
    
    // Import here to avoid circular dependency
    const clientPromise = (await import('@/lib/mongodb')).default;
    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');
    
    // Find the highest existing staff ID with this prefix
    const existingLecturers = await lecturersCollection
      .find({ staffId: { $regex: `^${prefix}` } })
      .sort({ staffId: -1 })
      .limit(1)
      .toArray();
    
    let nextNumber = 1;
    if (existingLecturers.length > 0) {
      const lastStaffId = existingLecturers[0].staffId;
      const lastNumber = parseInt(lastStaffId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    // Format number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    return `${prefix}${formattedNumber}`;
  } catch (error) {
    console.error('Error generating staff ID:', error);
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `${departmentCode}-${timestamp}`;
  }
};