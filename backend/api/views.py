from rest_framework import viewsets
from .models import SentencePair, Alignment
from .serializers import SentencePairSerializer, AlignmentSerializer

class SentencePairViewSet(viewsets.ModelViewSet):
    queryset = SentencePair.objects.all()
    serializer_class = SentencePairSerializer

class AlignmentViewSet(viewsets.ModelViewSet):
    queryset = Alignment.objects.all()
    serializer_class = AlignmentSerializer
    
    def perform_create(self, serializer):
        sentence_pair_id = self.request.data.get('sentence_pair_id')
        if sentence_pair_id:
            serializer.save(sentence_pair_id=sentence_pair_id)
        else:
            serializer.save()