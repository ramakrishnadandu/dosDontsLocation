import 'package:flutter/foundation.dart';
import '../data/repositories/auth_repository.dart';

class AuthController extends ChangeNotifier {
  final AuthRepository _repository;
  bool isSignedIn = false;
  bool isLoading = false;
  String? errorMessage;

  AuthController(this._repository);

  Future<void> restore() async {
    isSignedIn = await _repository.isSignedIn();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.login(email: email, password: password);
      isSignedIn = true;
      return true;
    } catch (e) {
      errorMessage = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register(String email, String password, String displayName) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.register(email: email, password: password, displayName: displayName);
      isSignedIn = true;
      return true;
    } catch (e) {
      errorMessage = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    isSignedIn = false;
    notifyListeners();
  }
}
