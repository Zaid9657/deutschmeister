// The Arabic i18next bundle for the app chrome on the routes translated for
// the pilot (src/lib/locale.js AR_READY_PATTERN): the account screens, the
// navigation and the fallback notice. Registered by src/locales/ar/index.js.
//
// STATUS: DRAFT — machine-authored Modern Standard Arabic, not yet reviewed by
// a qualified human (docs/arabic/translation-guide.md).
//
// Two kinds of key:
//   * `nav.*`, `auth.*`, `a11y.*` — the same keys the English and German
//     resources carry (src/utils/i18n.js);
//   * `account.*`, `localeFallback.*` — Arabic-only copy for screens whose
//     English still lives inline in the component (the codebase's
//     `isGerman ? … : …` idiom, tests pin those English lines), shown through
//     useArabicT() (src/locales/useArabic.js) only when the interface is Arabic.
//
// Honesty rules for this file: the confirmation and password-reset emails are
// sent by Supabase in ENGLISH (the templates live in the Supabase dashboard,
// not in this repository), so every screen that points at an email says that
// the email is in English and quotes its English subject — never an Arabic
// subject that does not exist.
const APP_STRINGS_AR = {
  a11y: {
    skipToContent: 'انتقل إلى المحتوى',
  },
  nav: {
    home: 'الرئيسية',
    dashboard: 'لوحة التحكم',
    grammar: 'القواعد',
    reading: 'القراءة',
    profile: 'الملف الشخصي',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
  },
  auth: {
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    updatePassword: 'تحديث كلمة المرور',
    newPassword: 'كلمة المرور الجديدة',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    sendResetLink: 'أرسل رابط إعادة التعيين',
    checkEmail: 'ستصلك رسالة فيها رابط لإعادة تعيين كلمة المرور على:',
    passwordUpdated: 'تم تحديث كلمة المرور بنجاح',
    verifyEmail: 'يُرجى تأكيد بريدك الإلكتروني للمتابعة',
  },
  localeFallback: {
    label: 'تنبيه اللغة',
    body: 'هذه الصفحة غير متوفرة بالعربية بعد، لذلك تظهر بالإنجليزية. الدورة A1.1 (الدروس 1–3) والحساب متوفران بالعربية.',
    continueEnglish: 'متابعة بالإنجليزية',
    backToCourse: 'العودة إلى دورة A1.1',
  },
  account: {
    emailInEnglish: 'تنبيه: تصل هذه الرسالة الإلكترونية حاليًا باللغة الإنجليزية.',
    unexpected: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    loading: 'جارٍ التحميل…',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'كلمة المرور',
    minPasswordPlaceholder: '6 أحرف على الأقل',
    confirmPlaceholder: 'أعد كتابة كلمة المرور',
    showPassword: 'أظهر كلمة المرور',
    hidePassword: 'أخفِ كلمة المرور',
    passwordsDontMatch: 'كلمتا المرور غير متطابقتين',
    passwordTooShort: 'يجب أن تتكوّن كلمة المرور من 6 أحرف على الأقل',
    serverError: 'تعذّر إتمام الطلب. رسالة الخادم بالإنجليزية:',
    errors: {
      invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      user_already_exists: 'يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول، أو أعد تعيين كلمة المرور إن نسيتها.',
      weak_password: 'كلمة المرور ضعيفة جدًا. اختر كلمة مرور أطول.',
      email_address_invalid: 'عنوان البريد الإلكتروني غير صالح. تحقّق منه.',
      over_email_send_rate_limit: 'أُرسلت رسائل كثيرة في وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.',
      over_request_rate_limit: 'محاولات كثيرة في وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.',
      same_password: 'كلمة المرور الجديدة يجب أن تختلف عن القديمة.',
      network: 'لا يوجد اتصال بالخادم. تحقّق من الإنترنت وحاول مرة أخرى.',
    },
    login: {
      seoTitle: 'تسجيل الدخول',
      title: 'مرحبًا بعودتك',
      subtitle: 'سجّل الدخول لتتابع تعلّم الألمانية',
      timedOut: 'سُجّل خروجك لأنك لم تستخدم الموقع مدة طويلة.',
      unconfirmedTitle: 'حسابك موجود — لكنه لم يُفعَّل بعد.',
      unconfirmedBody: 'ابحث عن رسالة بالإنجليزية عنوانها «Confirm your DeutschMeister account» واضغط على الرابط في أحدث رسالة. تحقّق من مجلد البريد غير المرغوب فيه أيضًا.',
      sentTo: 'أُرسلت إلى {{email}} — اضغط على الرابط في تلك الرسالة، ثم سجّل الدخول هنا.',
      resend: 'أرسل لي رسالة تأكيد جديدة',
    },
    signup: {
      seoTitle: 'إنشاء حساب مجاني',
      purchaseStep: 'الخطوة 1 من 2 · حسابك',
      purchaseBody: 'بعد ذلك تُفتح صفحة الدفع لـ {{label}} ({{price}}) تلقائيًا عندما تعود إلى هذا المتصفح بعد تأكيد بريدك. صفحة الدفع قد تظهر بالإنجليزية.',
      title: 'احفظ تقدّمك بحساب مجاني',
      lead: 'إنشاء حساب مجاني يحفظ دروسك على كل أجهزتك ويبدأ تجربة Pro لمدة {{days}} أيام. لا نطلب أي بيانات دفع.',
      benefitSave: 'يُنقل ما أنجزته في هذا المتصفح إلى حسابك تلقائيًا',
      benefitReview: 'مراجعة الكلمات والجمل في الوقت المناسب',
      benefitTrial: 'خلال التجربة: كل المستويات الـ{{levels}} (الشرح العربي يغطي A1.1 الدروس 1–3 فقط)',
      benefitAi: 'خلال التجربة: {{writing}} تقييمات آلية للكتابة و{{speaking}} جلسات تحدّث بالذكاء الاصطناعي (بالألمانية والإنجليزية)',
      lookAround: 'تريد أن تبدأ أولًا؟',
      startWithoutAccount: 'ابدأ الدرس 1 دون حساب.',
      placed: 'نتيجة اختبار المستوى، {{level}}، تُحفظ في حسابك عند أول تسجيل دخول في هذا المتصفح.',
      inboxTitle: 'افتح بريدك الإلكتروني',
      inboxSentTo: 'أرسلنا رابط التأكيد إلى:',
      inboxBody: 'افتح الرسالة التي عنوانها «Confirm your DeutschMeister account» (الرسالة بالإنجليزية) واضغط على الرابط فيها. الرابط يفعّل حسابك ويسجّل دخولك. إذا وصلتك رسالة ترحيب أيضًا، فالرابط المطلوب ما زال في رسالة التأكيد. تحقّق من مجلد البريد غير المرغوب فيه كذلك.',
      sentAgain: 'أُرسلت مرة أخرى. استخدم الرابط في أحدث رسالة.',
      limitReached: 'بلغنا الحد الأقصى لرسائل التأكيد الآن، لذلك لا يمكننا إرسال رسالة أخرى. حاول لاحقًا، وابحث في مجلد البريد غير المرغوب فيه عن الرسالة التي أرسلناها.',
      sendAgainIn: 'أرسلها مرة أخرى بعد {{s}} ثانية',
      sendAgain: 'أرسلها مرة أخرى',
      wrongAddress: 'العنوان خاطئ؟',
      useDifferent: 'استخدم بريدًا آخر',
      signedUpBefore: 'سجّلت بهذا العنوان من قبل؟',
      creating: 'جارٍ إنشاء الحساب…',
      trust: 'حساب مجاني · دون بطاقة ائتمان · لا خصم تلقائي عند انتهاء التجربة',
    },
    reset: {
      seoTitle: 'إعادة تعيين كلمة المرور',
      lead: 'أدخل بريدك الإلكتروني لنرسل لك رابط إعادة التعيين',
      checkTitle: 'افتح بريدك الإلكتروني',
      backToLogin: 'العودة إلى تسجيل الدخول',
    },
    update: {
      seoTitle: 'تحديث كلمة المرور',
      lead: 'أدخل كلمة المرور الجديدة',
      doneTitle: 'تم تحديث كلمة المرور!',
      redirecting: 'جارٍ تحويلك إلى تسجيل الدخول…',
    },
    verify: {
      seoTitle: 'تأكيد البريد الإلكتروني',
      title: 'أكّد بريدك الإلكتروني',
      sentTo: 'أرسلنا رسالة تأكيد إلى:',
      body: 'اضغط على الرابط في تلك الرسالة (وهي بالإنجليزية) لتفعيل حسابك. تتحدّث هذه الصفحة تلقائيًا.',
      waiting: 'في انتظار التأكيد…',
      sentAgain: 'أُرسلت الرسالة مرة أخرى.',
      resend: 'أعد إرسال الرسالة',
      signOut: 'سجّل الخروج واستخدم بريدًا آخر',
      tip: 'تلميح: تحقّق من مجلد البريد غير المرغوب فيه أيضًا.',
    },
    trial: {
      endsToday: 'تنتهي تجربتك اليوم!',
      lastDays: 'يتبقى {{n}} يوم من تجربتك. بعد ذلك يبقى {{free}} مجانيًا.',
      daysLeft: 'يتبقى لك {{n}} يوم من الوصول الكامل.',
      upgrade: 'الترقية إلى Pro',
      dismiss: 'إغلاق',
    },
  },
};

export default APP_STRINGS_AR;
