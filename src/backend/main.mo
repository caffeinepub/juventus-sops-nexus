import Time "mo:core/Time";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  module Item {
    public func compare(a : CartItem, b : CartItem) : Order.Order {
      switch (Text.compare(a.product.name, b.product.name)) {
        case (#equal) {
          Nat32.compare(a.quantity, b.quantity);
        };
        case (order) {
          order;
        };
      };
    };
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Service {
    public func compare(a : Service, b : Service) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module OrderModule {
    public type Status = {
      #pending;
      #processing;
      #completed;
      #cancelled;
    };
  };

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    imageUrl : Text;
    isFeatured : Bool;
    isAvailable : Bool;
  };

  type Service = {
    id : Nat;
    name : Text;
    description : Text;
    priceLabel : Text;
    category : Text;
    imageUrl : Text;
    isFeatured : Bool;
  };

  type CartItem = {
    product : Product;
    quantity : Nat32;
  };

  type OrderType = {
    id : Nat;
    user : Principal;
    items : [CartItem];
    totalAmount : Nat;
    status : OrderModule.Status;
    createdAt : Time.Time;
  };

  type ServiceInquiry = {
    id : Nat;
    user : Principal;
    serviceId : Nat;
    message : Text;
    contactEmail : Text;
    createdAt : Time.Time;
  };

  type PaymentMethod = {
    id : Nat;
    methodName : Text;
    accountNumber : Text;
    accountName : Text;
    bankName : Text;
    instructions : Text;
  };

  type PaymentConfirmation = {
    id : Nat;
    orderId : Nat;
    user : Principal;
    receiptNote : Text;
    contactEmail : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  public type UserRecord = {
    principal : Principal;
    role : AccessControl.UserRole;
    profileName : ?Text;
    joinedAt : Time.Time;
  };

  // Stable storage arrays — survive upgrades
  stable var stableProducts : [(Nat, Product)] = [];
  stable var stableServices : [(Nat, Service)] = [];
  stable var stableCarts : [(Principal, [CartItem])] = [];
  stable var stableOrders : [(Nat, OrderType)] = [];
  stable var stableInquiries : [(Nat, ServiceInquiry)] = [];
  stable var stableUserProfiles : [(Principal, UserProfile)] = [];
  stable var stableUserJoinedAt : [(Principal, Time.Time)] = [];
  stable var stablePaymentMethods : [(Nat, PaymentMethod)] = [];
  stable var stablePaymentConfirmations : [(Nat, PaymentConfirmation)] = [];

  // Stable counters
  stable var nextProductId : Nat = 1;
  stable var nextServiceId : Nat = 1;
  stable var nextOrderId : Nat = 1;
  stable var nextInquiryId : Nat = 1;
  stable var nextPaymentMethodId : Nat = 1;
  stable var nextPaymentConfirmationId : Nat = 1;

  // Runtime (non-stable) maps — rebuilt from stable arrays on startup/upgrade
  var products = Map.empty<Nat, Product>();
  var services = Map.empty<Nat, Service>();
  var carts = Map.empty<Principal, List.List<CartItem>>();
  var orders = Map.empty<Nat, OrderType>();
  var inquiries = Map.empty<Nat, ServiceInquiry>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var userJoinedAt = Map.empty<Principal, Time.Time>();
  var paymentMethods = Map.empty<Nat, PaymentMethod>();
  var paymentConfirmations = Map.empty<Nat, PaymentConfirmation>();

  // Restore runtime maps from stable arrays
  func restoreFromStable() {
    products := Map.empty<Nat, Product>();
    for ((k, v) in stableProducts.vals()) { products.add(k, v) };

    services := Map.empty<Nat, Service>();
    for ((k, v) in stableServices.vals()) { services.add(k, v) };

    carts := Map.empty<Principal, List.List<CartItem>>();
    for ((k, items) in stableCarts.vals()) {
      var lst = List.empty<CartItem>();
      for (item in items.vals()) { lst.add(item) };
      carts.add(k, lst);
    };

    orders := Map.empty<Nat, OrderType>();
    for ((k, v) in stableOrders.vals()) { orders.add(k, v) };

    inquiries := Map.empty<Nat, ServiceInquiry>();
    for ((k, v) in stableInquiries.vals()) { inquiries.add(k, v) };

    userProfiles := Map.empty<Principal, UserProfile>();
    for ((k, v) in stableUserProfiles.vals()) { userProfiles.add(k, v) };

    userJoinedAt := Map.empty<Principal, Time.Time>();
    for ((k, v) in stableUserJoinedAt.vals()) { userJoinedAt.add(k, v) };

    paymentMethods := Map.empty<Nat, PaymentMethod>();
    for ((k, v) in stablePaymentMethods.vals()) { paymentMethods.add(k, v) };

    paymentConfirmations := Map.empty<Nat, PaymentConfirmation>();
    for ((k, v) in stablePaymentConfirmations.vals()) { paymentConfirmations.add(k, v) };
  };

  // Run restore on initial deployment
  restoreFromStable();

  // Save runtime maps to stable arrays before upgrade
  system func preupgrade() {
    stableProducts := products.entries().toArray();
    stableServices := services.entries().toArray();
    stableCarts := Array.tabulate(
      carts.size(),
      func(i) {
        let (k, v) = carts.entries().toArray()[i];
        (k, v.toArray());
      }
    );
    stableOrders := orders.entries().toArray();
    stableInquiries := inquiries.entries().toArray();
    stableUserProfiles := userProfiles.entries().toArray();
    stableUserJoinedAt := userJoinedAt.entries().toArray();
    stablePaymentMethods := paymentMethods.entries().toArray();
    stablePaymentConfirmations := paymentConfirmations.entries().toArray();
  };

  // Rebuild runtime maps after upgrade
  system func postupgrade() {
    restoreFromStable();
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func ensureUserTracked(user : Principal) {
    switch (userJoinedAt.get(user)) {
      case (null) {
        userJoinedAt.add(user, Time.now());
      };
      case (?_) {};
    };
  };

  public shared ({ caller }) func registerUser() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot register");
    };
    ensureUserTracked(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    ensureUserTracked(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = nextProductId;
    nextProductId += 1;
    let newProduct : Product = { product with id };
    products.add(id, newProduct);
  };

  public shared ({ caller }) func updateProduct(id : Nat, updatedProduct : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) { products.add(id, updatedProduct) };
    };
  };

  public shared ({ caller }) func removeProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProducts(category : ?Text) : async [Product] {
    let iter = products.values();
    let filtered = iter.filter(
      func(p) {
        switch (category) {
          case (null) { true };
          case (?cat) { Text.equal(p.category, cat) };
        };
      }
    );
    filtered.toArray().sort();
  };

  public shared ({ caller }) func addService(service : Service) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = nextServiceId;
    nextServiceId += 1;
    let newService : Service = { service with id };
    services.add(id, newService);
  };

  public shared ({ caller }) func updateService(id : Nat, updatedService : Service) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?_) { services.add(id, updatedService) };
    };
  };

  public shared ({ caller }) func removeService(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    services.remove(id);
  };

  public query ({ caller }) func getServices() : async [Service] {
    services.values().toArray().sort();
  };

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat32) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    ensureUserTracked(caller);
    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
    let cart = getCartInternal(caller);
    let newItem : CartItem = { product; quantity };
    cart.add(newItem);
    carts.add(caller, cart);
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    let cart = getCartInternal(caller);
    let filtered = cart.filter(
      func(item) { item.product.id != productId }
    );
    carts.add(caller, filtered);
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, quantity : Nat32) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    let cart = getCartInternal(caller);
    let newCart = cart.map<CartItem, CartItem>(func(item) {
      if (item.product.id == productId) {
        { item with quantity };
      } else {
        item;
      };
    });
    carts.add(caller, newCart);
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    carts.add(caller, List.empty<CartItem>());
  };

  func getCartInternal(user : Principal) : List.List<CartItem> {
    switch (carts.get(user)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    let cart = getCartInternal(caller);
    cart.toArray().sort();
  };

  public shared ({ caller }) func placeOrder() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    ensureUserTracked(caller);
    let cart = getCartInternal(caller);
    if (cart.size() == 0) { Runtime.trap("Cart is empty") };

    let id = nextOrderId;
    nextOrderId += 1;

    let totalAmount = cart.foldLeft(
      0,
      func(acc, item) { acc + (item.product.price * item.quantity.toNat()) },
    );

    let newOrder : OrderType = {
      id;
      user = caller;
      items = cart.toArray();
      totalAmount;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(id, newOrder);
    carts.add(caller, List.empty<CartItem>());
    id;
  };

  public query ({ caller }) func getOrders() : async [OrderType] {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      orders.values().toArray();
    } else if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      let userOrders = orders.values().filter(
        func(order) { order.user == caller }
      );
      userOrders.toArray();
    } else {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderModule.Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : OrderType = {
          order with status;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func submitInquiry(serviceId : Nat, message : Text, contactEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit inquiries");
    };
    ensureUserTracked(caller);
    let id = nextInquiryId;
    nextInquiryId += 1;
    let newInquiry : ServiceInquiry = {
      id;
      user = caller;
      serviceId;
      message;
      contactEmail;
      createdAt = Time.now();
    };
    inquiries.add(id, newInquiry);
  };

  public query ({ caller }) func getInquiries() : async [ServiceInquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view inquiries");
    };
    inquiries.values().toArray();
  };

  // ---- Payment Methods ----

  public shared ({ caller }) func addPaymentMethod(method : PaymentMethod) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage payment methods");
    };
    let pmId = nextPaymentMethodId;
    nextPaymentMethodId += 1;
    let newMethod : PaymentMethod = { method with id = pmId };
    paymentMethods.add(pmId, newMethod);
  };

  public shared ({ caller }) func updatePaymentMethod(id : Nat, method : PaymentMethod) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage payment methods");
    };
    paymentMethods.add(id, method);
  };

  public shared ({ caller }) func removePaymentMethod(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage payment methods");
    };
    paymentMethods.remove(id);
  };

  public query func getPaymentMethods() : async [PaymentMethod] {
    paymentMethods.values().toArray();
  };

  // ---- Payment Confirmations ----

  public shared ({ caller }) func submitPaymentConfirmation(orderId : Nat, receiptNote : Text, contactEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit payment confirmations");
    };
    let id = nextPaymentConfirmationId;
    nextPaymentConfirmationId += 1;
    let conf : PaymentConfirmation = {
      id;
      orderId;
      user = caller;
      receiptNote;
      contactEmail;
      createdAt = Time.now();
    };
    paymentConfirmations.add(id, conf);
  };

  public query ({ caller }) func getPaymentConfirmations() : async [PaymentConfirmation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view payment confirmations");
    };
    paymentConfirmations.values().toArray();
  };

  public query ({ caller }) func getUsers() : async [UserRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let allUsers = Map.empty<Principal, Bool>();

    for ((user, _) in userProfiles.entries()) {
      allUsers.add(user, true);
    };

    for ((_, order) in orders.entries()) {
      allUsers.add(order.user, true);
    };

    for ((_, inquiry) in inquiries.entries()) {
      allUsers.add(inquiry.user, true);
    };

    for ((user, _) in carts.entries()) {
      allUsers.add(user, true);
    };

    for ((user, _) in userJoinedAt.entries()) {
      allUsers.add(user, true);
    };

    let userRecords = Array.tabulate(
      allUsers.size(),
      func(i) {
        let (user, _) = allUsers.entries().toArray()[i];
        let role = AccessControl.getUserRole(accessControlState, user);
        let profile = userProfiles.get(user);
        let profileName = switch (profile) {
          case (null) { null };
          case (?p) { ?p.name };
        };
        let joinedAt = switch (userJoinedAt.get(user)) {
          case (null) { Time.now() };
          case (?timestamp) { timestamp };
        };

        {
          principal = user;
          role;
          profileName;
          joinedAt;
        };
      }
    );

    userRecords;
  };
};
