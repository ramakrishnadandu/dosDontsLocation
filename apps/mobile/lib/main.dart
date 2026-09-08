import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'application/auth_controller.dart';
import 'application/location_controller.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/community_repository.dart';
import 'data/repositories/location_repository.dart';
import 'data/repositories/preferences_repository.dart';
import 'data/repositories/product_repository.dart';
import 'data/repositories/saved_location_repository.dart';
import 'presentation/screens/splash_screen.dart';

void main() {
  runApp(const LocaGuideApp());
}

class LocaGuideApp extends StatelessWidget {
  const LocaGuideApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = ApiClient();
    final authRepository = AuthRepository(apiClient);

    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        Provider<LocationRepository>(create: (_) => LocationRepository(apiClient)),
        Provider<CommunityRepository>(create: (_) => CommunityRepository(apiClient)),
        Provider<ProductRepository>(create: (_) => ProductRepository(apiClient)),
        Provider<PreferencesRepository>(create: (_) => PreferencesRepository(apiClient)),
        Provider<SavedLocationRepository>(create: (_) => SavedLocationRepository(apiClient)),
        Provider<AuthRepository>.value(value: authRepository),
        ChangeNotifierProvider<AuthController>(
          create: (context) => AuthController(context.read<AuthRepository>())..restore(),
        ),
        ChangeNotifierProvider<LocationController>(
          create: (context) => LocationController(context.read<LocationRepository>()),
        ),
      ],
      child: MaterialApp(
        title: 'LocaGuide',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        supportedLocales: const [Locale('en'), Locale('hi'), Locale('te')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const SplashScreen(),
      ),
    );
  }
}
