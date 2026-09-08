import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_te.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('te')
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'LocaGuide'**
  String get appName;

  /// No description provided for @onboardingTitle.
  ///
  /// In en, this message translates to:
  /// **'Know before you go'**
  String get onboardingTitle;

  /// No description provided for @onboardingBody.
  ///
  /// In en, this message translates to:
  /// **'LocaGuide turns reviews, community tips, and official data into a clear briefing for any place you visit.'**
  String get onboardingBody;

  /// No description provided for @grantLocationPermission.
  ///
  /// In en, this message translates to:
  /// **'Allow location access'**
  String get grantLocationPermission;

  /// No description provided for @permissionExplainer.
  ///
  /// In en, this message translates to:
  /// **'LocaGuide uses your location only to find nearby places. Precise location history is never stored.'**
  String get permissionExplainer;

  /// No description provided for @continueButton.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueButton;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @homeNearby.
  ///
  /// In en, this message translates to:
  /// **'Nearby'**
  String get homeNearby;

  /// No description provided for @homeSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search a place, category, or address'**
  String get homeSearchHint;

  /// No description provided for @sectionOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get sectionOverview;

  /// No description provided for @sectionDo.
  ///
  /// In en, this message translates to:
  /// **'Do'**
  String get sectionDo;

  /// No description provided for @sectionConsider.
  ///
  /// In en, this message translates to:
  /// **'Consider'**
  String get sectionConsider;

  /// No description provided for @sectionWatch.
  ///
  /// In en, this message translates to:
  /// **'Watch'**
  String get sectionWatch;

  /// No description provided for @sectionSpending.
  ///
  /// In en, this message translates to:
  /// **'Spending'**
  String get sectionSpending;

  /// No description provided for @sectionMustSee.
  ///
  /// In en, this message translates to:
  /// **'Must See'**
  String get sectionMustSee;

  /// No description provided for @sectionProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get sectionProducts;

  /// No description provided for @sectionCommunity.
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get sectionCommunity;

  /// No description provided for @sectionHealthAware.
  ///
  /// In en, this message translates to:
  /// **'Health Aware'**
  String get sectionHealthAware;

  /// No description provided for @iWasHere.
  ///
  /// In en, this message translates to:
  /// **'I was here'**
  String get iWasHere;

  /// No description provided for @visitToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get visitToday;

  /// No description provided for @visitThisWeek.
  ///
  /// In en, this message translates to:
  /// **'This week'**
  String get visitThisWeek;

  /// No description provided for @visitEarlier.
  ///
  /// In en, this message translates to:
  /// **'Earlier'**
  String get visitEarlier;

  /// No description provided for @addOpinion.
  ///
  /// In en, this message translates to:
  /// **'Add your opinion'**
  String get addOpinion;

  /// No description provided for @yourRating.
  ///
  /// In en, this message translates to:
  /// **'Your rating'**
  String get yourRating;

  /// No description provided for @whatDidYouLike.
  ///
  /// In en, this message translates to:
  /// **'What did you like?'**
  String get whatDidYouLike;

  /// No description provided for @whatDidYouDislike.
  ///
  /// In en, this message translates to:
  /// **'What did you dislike?'**
  String get whatDidYouDislike;

  /// No description provided for @yourTip.
  ///
  /// In en, this message translates to:
  /// **'A tip for other visitors'**
  String get yourTip;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @demoDataLabel.
  ///
  /// In en, this message translates to:
  /// **'Demo data'**
  String get demoDataLabel;

  /// No description provided for @evidenceFact.
  ///
  /// In en, this message translates to:
  /// **'Fact'**
  String get evidenceFact;

  /// No description provided for @evidenceReviewSignal.
  ///
  /// In en, this message translates to:
  /// **'Review signal'**
  String get evidenceReviewSignal;

  /// No description provided for @evidenceCommunityOpinion.
  ///
  /// In en, this message translates to:
  /// **'Community opinion'**
  String get evidenceCommunityOpinion;

  /// No description provided for @evidenceAiInterpretation.
  ///
  /// In en, this message translates to:
  /// **'AI interpretation · not verified'**
  String get evidenceAiInterpretation;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @preferences.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferences;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// No description provided for @reportContent.
  ///
  /// In en, this message translates to:
  /// **'Report content'**
  String get reportContent;

  /// No description provided for @productSearch.
  ///
  /// In en, this message translates to:
  /// **'Product search'**
  String get productSearch;

  /// No description provided for @deals.
  ///
  /// In en, this message translates to:
  /// **'Deals'**
  String get deals;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get signUp;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @displayName.
  ///
  /// In en, this message translates to:
  /// **'Display name'**
  String get displayName;

  /// No description provided for @helpful.
  ///
  /// In en, this message translates to:
  /// **'Helpful'**
  String get helpful;

  /// No description provided for @notHelpful.
  ///
  /// In en, this message translates to:
  /// **'Not helpful'**
  String get notHelpful;

  /// No description provided for @report.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get report;

  /// No description provided for @deleteMyData.
  ///
  /// In en, this message translates to:
  /// **'Delete my data'**
  String get deleteMyData;

  /// No description provided for @exportMyData.
  ///
  /// In en, this message translates to:
  /// **'Export my data'**
  String get exportMyData;

  /// No description provided for @notAvailable.
  ///
  /// In en, this message translates to:
  /// **'Information not available from the current sources.'**
  String get notAvailable;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'te'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'te':
      return AppLocalizationsTe();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
