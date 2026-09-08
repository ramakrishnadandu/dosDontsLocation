import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/community_repository.dart';
import 'sign_in_screen.dart';

/// Section 6/17: report a specific community opinion. Actually submits via
/// CommunityRepository.vote(voteType: "REPORT") - this used to just show a
/// fake success message without calling anything, which is exactly the
/// kind of half-finished UI this app's own design principles forbid.
class ReportContentScreen extends StatefulWidget {
  final String opinionId;

  const ReportContentScreen({super.key, required this.opinionId});

  @override
  State<ReportContentScreen> createState() => _ReportContentScreenState();
}

class _ReportContentScreenState extends State<ReportContentScreen> {
  String _reason = 'SPAM';
  final _detailsController = TextEditingController();
  bool _submitting = false;
  String? _error;

  static const _reasons = ['SPAM', 'HARASSMENT', 'PERSONAL_INFORMATION', 'FRAUD', 'MALICIOUS_LINK', 'OTHER'];

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<CommunityRepository>().vote(
            opinionId: widget.opinionId,
            voteType: 'REPORT',
            reportReason: _detailsController.text.trim().isEmpty ? _reason : '$_reason: ${_detailsController.text.trim()}',
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted. Thank you.')));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('401')) {
        final signedIn = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const SignInScreen()));
        if (signedIn == true) await _submit();
      } else if (e.toString().contains('409')) {
        setState(() => _error = 'You have already reported this.');
      } else {
        setState(() => _error = 'Could not submit report: $e');
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report content')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Why are you reporting this?'),
          RadioGroup<String>(
            groupValue: _reason,
            onChanged: (v) => setState(() => _reason = v ?? _reason),
            child: Column(
              children: _reasons
                  .map((r) => RadioListTile<String>(title: Text(r.replaceAll('_', ' ')), value: r))
                  .toList(),
            ),
          ),
          TextField(
            controller: _detailsController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Additional details (optional)'),
          ),
          const SizedBox(height: 16),
          if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit report'),
          ),
        ],
      ),
    );
  }
}
