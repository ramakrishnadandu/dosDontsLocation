import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'home_screen.dart';

/// Section 14: explicit, user-initiated location permission request. No
/// background tracking is ever requested here - only "while using the app"
/// foreground access, and only to power nearby search.
class PermissionScreen extends StatefulWidget {
  const PermissionScreen({super.key});

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  bool _requesting = false;

  Future<void> _requestPermission() async {
    setState(() => _requesting = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
    } finally {
      if (mounted) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.location_on_outlined, size: 56),
              const SizedBox(height: 16),
              Text('Allow location access', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              const Text(
                'LocaGuide uses your location only to find nearby places. Precise location '
                'history is never stored - see Settings > Privacy for full details.',
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _requesting ? null : _requestPermission,
                  child: _requesting ? const CircularProgressIndicator() : const Text('Allow location access'),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
                ),
                child: const Text('Skip - I will search manually'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
