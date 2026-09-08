import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/preferences_repository.dart';

class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  String? _budgetLevel;
  bool _travelingWithFamily = false;
  String _language = 'en';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await context.read<PreferencesRepository>().get();
      setState(() {
        _budgetLevel = prefs['budgetLevel'] as String?;
        _travelingWithFamily = prefs['travelingWithFamily'] as bool? ?? false;
        _language = prefs['preferredLanguage'] as String? ?? 'en';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    await context.read<PreferencesRepository>().update({
      'budgetLevel': _budgetLevel,
      'travelingWithFamily': _travelingWithFamily,
      'preferredLanguage': _language,
    });
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Preferences saved')));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: const Text('Preferences')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Budget'),
          DropdownButton<String>(
            value: _budgetLevel,
            hint: const Text('Not set'),
            items: const [
              DropdownMenuItem(value: 'LOW', child: Text('Low')),
              DropdownMenuItem(value: 'MEDIUM', child: Text('Medium')),
              DropdownMenuItem(value: 'HIGH', child: Text('High')),
            ],
            onChanged: (v) => setState(() => _budgetLevel = v),
          ),
          SwitchListTile(
            title: const Text('Traveling with family'),
            value: _travelingWithFamily,
            onChanged: (v) => setState(() => _travelingWithFamily = v),
          ),
          const Text('Preferred language'),
          DropdownButton<String>(
            value: _language,
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English')),
              DropdownMenuItem(value: 'hi', child: Text('हिन्दी')),
              DropdownMenuItem(value: 'te', child: Text('తెలుగు')),
            ],
            onChanged: (v) => setState(() => _language = v ?? 'en'),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _save, child: const Text('Save')),
          TextButton(
            onPressed: () async {
              await context.read<PreferencesRepository>().reset();
              _load();
            },
            child: const Text('Reset personalization data'),
          ),
        ],
      ),
    );
  }
}
